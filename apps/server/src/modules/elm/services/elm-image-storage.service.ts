/**
 * Elm 图片本地存储。
 *
 * 目录结构（011 §4.2）：
 *   <ELM_IMAGE_DIR>/
 *     <sha256(契约路径)>.img      正式资产（完整校验后才发布）
 *     .<sha256>.<随机标识>.tmp    下载中临时文件（进程失败不会误判为成功）
 *     import-result.json          导入结果清单（原子更新）
 *
 * 原子保存：完整 buffer 写入 .tmp 并 fsync 关闭后，rename 成 .img。
 * Windows 的 fs.rename 在同目录内是原子替换（目标存在会覆盖），
 * 因此「半文件被提供给客户端」的路径不存在 —— 客户端永远读不到未完成的 .img。
 *
 * 文件键由契约路径算出（见 utils/elm-image.ts imageAssetKey），
 * 这里只负责「读已有完整资产」「原子落盘」，不关心上游在哪。
 */

import { randomUUID } from 'node:crypto'
import { mkdir, open, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { detectImageMime, imageAssetKey, MIN_BYTES_TO_SNIFF } from '../utils/elm-image'

/** 读取本地完整图片的结果。status=ok 时 contentType 可用，字节按需读取。 */
export type LocalImageResult
  = | {
    status: 'ok'
    assetKey: string
    contentType: string
    bytes: number
  }
  | {
    status: 'missing'
    assetKey: string
  }

/** 单张上限 10 MiB（011 §4.4：并发 4 → 峰值约 40 MiB 缓冲）。 */
export const ELM_IMAGE_MAX_BYTES = 10 * 1024 * 1024

@Injectable()
export class ElmImageStorageService {
  private readonly logger = new Logger(ElmImageStorageService.name)
  /** 相对 process.cwd()（即 apps/server）解析，绝对路径原样使用。 */
  private readonly rootDir: string

  constructor(private readonly configService: ConfigService) {
    const configured = this.configService.get<string>('elmImages.directory') ?? 'uploads/elm-images'
    this.rootDir = path.resolve(process.cwd(), configured)
  }

  /** 目录绝对路径（测试与验收用）。 */
  getRootDir(): string {
    return this.rootDir
  }

  /** 契约路径 → 本地 .img 文件路径。路径校验在调用方（resolveContractPath）完成。 */
  assetFile(contractPath: `/${string}`): string {
    return path.join(this.rootDir, `${imageAssetKey(contractPath)}.img`)
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true })
  }

  /**
   * 读本地完整图片资产。
   *
   * - 文件不存在 → `{ status: 'missing' }`（不抛错：404 语义交给调用方判断）
   * - 文件存在但不是合法图片字节（损坏 / 被写坏）→ 同样返回 `missing`，
   *   避免把半文件 / 非图文件提供给客户端（011 §2.1 完成标准 4）。
   *
   * 读到的字节直接返回（单张 ≤10 MiB，直接 buffer 供 StreamableFile 流式吐出，
   * 不再二次读盘）。
   */
  async readImage(contractPath: `/${string}`): Promise<LocalImageResult & { data: Buffer | null }> {
    const key = imageAssetKey(contractPath)
    const file = path.join(this.rootDir, `${key}.img`)

    let data: Buffer
    try {
      data = await readFile(file)
    }
    catch {
      return {
        status: 'missing',
        assetKey: key,
        data: null,
      }
    }

    const mime = detectImageMime(data)
    if (!mime || data.length > ELM_IMAGE_MAX_BYTES) {
      // 文件在但字节不是可识别图片（损坏 / 超限时不可能合法）：视为缺失，不对外提供。
      this.logger.warn(`本地图片 ${key}.img 不可读为图片（${data.length} B），按缺失处理`)
      return {
        status: 'missing',
        assetKey: key,
        data: null,
      }
    }

    return {
      status: 'ok',
      assetKey: key,
      contentType: mime,
      bytes: data.length,
      data,
    }
  }

  /**
   * 轻量完整度判断：只 stat + 读前 12 字节签名，不读整文件。
   * 导入「跳过已完整资产」时用这个，避免为跳过检查把每张 10MB 图都读一遍。
   * 判据：文件存在 + 大小非空 + 前 12 字节能识别为已知图片 + 不超限。
   */
  async isCompleteImage(contractPath: `/${string}`): Promise<boolean> {
    const key = imageAssetKey(contractPath)
    const file = path.join(this.rootDir, `${key}.img`)

    let size = 0
    try {
      size = (await stat(file)).size
    }
    catch {
      return false
    }
    if (size === 0 || size > ELM_IMAGE_MAX_BYTES)
      return false

    const fh = await open(file, 'r')
    try {
      const head = Buffer.alloc(MIN_BYTES_TO_SNIFF)
      const { bytesRead } = await fh.read(head, 0, MIN_BYTES_TO_SNIFF, 0)
      return detectImageMime(head.subarray(0, bytesRead)) !== null
    }
    catch {
      return false
    }
    finally {
      await fh.close()
    }
  }

  /**
   * 原子保存：先写 .tmp（含完整数据 + fsync），再 rename 成 .img。
   *
   * @param contractPath 契约路径
   * @param data 完整图片字节（调用方已用 validateImageBytes 校验 MIME）
   */
  async saveImage(contractPath: `/${string}`, data: Buffer): Promise<void> {
    const mime = ElmImageStorageService.validateImageBytes(data)
    if (!mime)
      throw new Error('refusing to save non-image or empty bytes')

    await this.ensureDir()
    const key = imageAssetKey(contractPath)
    const finalFile = path.join(this.rootDir, `${key}.img`)
    const tmpFile = path.join(this.rootDir, `.${key}.${randomUUID()}.tmp`)

    const fh = await open(tmpFile, 'w')
    try {
      await fh.writeFile(data)
      // 保证字节真正落盘再 rename（断电不留 0 字节 .img）
      await fh.sync()
    }
    finally {
      await fh.close()
    }

    await rename(tmpFile, finalFile)
  }

  /** 列出本地所有完整图片资产（*.img），用于盘点与体积统计。 */
  async listLocalAssets(): Promise<Array<{
    key: string
    bytes: number
  }>> {
    await this.ensureDir()
    const entries = await readdir(this.rootDir)
    const result: Array<{
      key: string
      bytes: number
    }> = []
    for (const entry of entries) {
      if (!entry.endsWith('.img'))
        continue
      const info = await stat(path.join(this.rootDir, entry))
      result.push({
        key: entry.slice(0, -4),
        bytes: info.size,
      })
    }
    return result
  }

  /** 原子更新导入结果清单（临时文件 + rename，避免读到半截 JSON）。 */
  async writeResultReport(fileName: string, report: unknown): Promise<void> {
    await this.ensureDir()
    const finalFile = path.join(this.rootDir, fileName)
    const tmpFile = path.join(this.rootDir, `.${fileName}.${randomUUID()}.tmp`)
    const json = JSON.stringify(report, null, 2)
    await writeFile(tmpFile, json, 'utf8')
    await rename(tmpFile, finalFile)
  }

  /**
   * 校验一段已下载字节是否可作为资产发布：非空、不超限、magic bytes 识别为已知图片。
   * 返回 MIME（null = 拒绝发布：空 / 超限 / HTML 假图 / 非图片）。
   */
  static validateImageBytes(data: Buffer, maxBytes: number = ELM_IMAGE_MAX_BYTES): string | null {
    if (data.length === 0)
      return null
    if (data.length > maxBytes)
      return null
    return detectImageMime(data)
  }
}

import { Readable } from 'node:stream'
import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { resolveUpstreamUrl, UpstreamUrlError } from '../../elm-upstream/utils/upstream-url'
import {
  CDN_UPSTREAM_ORIGIN,
  ElmImagePathError,
  resolveContractPath,
} from '../utils/elm-image'
import { ELM_IMAGE_MAX_BYTES, ElmImageStorageService } from './elm-image-storage.service'

export interface ProxiedImage {
  stream: Readable
  contentType: string
}

/** 下载结果。success=true 时字节已原子落盘；否则携带可归类的失败原因。 */
export type DownloadedImageResult
  = | {
    success: true
    bytes: number
    contentType: string
  }
  | {
    success: false
    /** 失败分类：404 / 非成功状态 / 空 body / 非图片字节 / 超限 / 超时 / 网络 / 磁盘 */
    reason:
      | 'not-found'
      | 'upstream-error'
      | 'empty-body'
      | 'non-image-bytes'
      | 'oversized'
      | 'timeout'
      | 'network'
      | 'disk'
    detail: string
  }

/**
 * 上游图片路径前缀。
 * ⚠️ 默认源对外契约是 `/api/img/X`，上游真实地址是 `https://elm.cangdu.org/img/X`
 * （Express 通配只捕获 `img/` 之后的部分，必须把 `/img` 补回去）。
 * CDN 源走 `fuss10.elemecdn.com`，无前缀。两条上游的取数路由现在集中在
 * utils/elm-image.ts 的 resolveContractPath()，这里只保留 origin 常量用于下载。
 */
const CDN_BASE_URL = CDN_UPSTREAM_ORIGIN

/**
 * Elm 图片服务：本地化后**图片读取不再走网络**，只读本地资产目录；
 * 图片**下载**是一个独立的显式动作（downloadImage），由导入命令调用。
 *
 * 为什么和迁移前的「转发上游」不同（011 §3）：
 * 现在正常图片请求只读本地文件，外部依赖在**运行时**被明确消除；
 * 上游只在「导入 / 补图」这一次性动作里被访问。接口 URL 形状（/api/img/*）保持不变，
 * 前端零改动。
 */
@Injectable()
export class ElmImageProxyService {
  private readonly logger = new Logger(ElmImageProxyService.name)
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(
    private readonly configService: ConfigService,
    private readonly storage: ElmImageStorageService,
  ) {
    this.baseUrl = (
      this.configService.get<string>('elmApi.baseUrl')
      ?? 'https://elm.cangdu.org'
    ).replace(/\/+$/, '')
    // 图片可能比 JSON 慢，单独配超时。本地化后这个超时时**完整 body 接收**（见 downloadImage）。
    this.timeoutMs
      = this.configService.get<number>('elmApi.imageTimeoutMs') ?? 15000
  }

  /**
   * 取本地图片（图片读取契约）。
   *
   * @param path 形如 `/187bcca1ec6114376.jpg`（默认源）或 `/cdn/2/35/x`（CDN 源），
   *   即 `/api/img` 之后的部分。
   *
   * ⚠️ 本地化后这里**不发起任何上游请求**：只读本地资产目录。
   * 路径无效或本地缺失 → 抛 NotFoundException（404），不回源、不重定向第三方。
   */
  async getImage(path: `/${string}`): Promise<ProxiedImage> {
    let target
    try {
      target = resolveContractPath(path)
    }
    catch (error) {
      if (error instanceof ElmImagePathError)
        throw new NotFoundException(`Invalid image path: ${error.message}`)
      throw error
    }

    const local = await this.storage.readImage(target.contractPath)
    if (local.status === 'missing') {
      // 本地没有这张图 → 404（离线验收时，缺图就如实 404，不伪造、不回源）
      throw new NotFoundException(`Local image not found for ${target.contractPath}`)
    }

    // 单张 ≤10 MiB，直接 buffer 流式吐出（保持 StreamableFile 流式语义）
    return {
      stream: Readable.from([local.data!]),
      contentType: local.contentType,
    }
  }

  /**
   * 下载一张图片到本地（导入命令专用）。这是唯一还会访问上游的方法。
   *
   * 约束（011 §4.4）：
   * - `redirect: 'error'`，复用 resolveUpstreamUrl 的 origin 校验 + 契约路径相对校验，防目录逃逸
   * - 单张上限 10 MiB，超时覆盖**响应头 + 完整 body 接收**（不同于旧实现的「拿到头就解除」）
   * - 落盘前按 magic bytes 校验为已知图片；非图 / 空 / 超限 / 超时 / 网络失败都不发布
   * - 成功才原子 saveImage；失败抛对应分类，调用方记录原因
   */
  async downloadImage(path: `/${string}`): Promise<DownloadedImageResult> {
    let target
    try {
      target = resolveContractPath(path)
    }
    catch (error) {
      if (error instanceof ElmImagePathError) {
        return {
          success: false,
          reason: 'network',
          detail: `invalid path: ${error.message}`,
        }
      }
      return {
        success: false,
        reason: 'network',
        detail: String(error),
      }
    }

    const baseUrl = target.isCdn ? CDN_BASE_URL : this.baseUrl
    let url: URL
    try {
      url = resolveUpstreamUrl(baseUrl, target.upstreamPath)
    }
    catch (error) {
      if (error instanceof UpstreamUrlError) {
        return {
          success: false,
          reason: 'network',
          detail: error.message,
        }
      }
      this.logger.error(
        `Invalid upstream base URL for image ${target.contractPath}`,
        error instanceof Error ? error.stack : String(error),
      )
      return {
        success: false,
        reason: 'network',
        detail: `invalid base URL: ${String(error)}`,
      }
    }

    const controller = new AbortController()
    // 超时覆盖「响应头 + 完整 body」：body 接收阶段仍在超时窗口内，
    // 避免大图被流式慢慢喂而不受限时。超时统一按 AbortError 归为 timeout。
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'error',
        signal: controller.signal,
      })

      if (response.status === 404) {
        await response.body?.cancel()
        return {
          success: false,
          reason: 'not-found',
          detail: `upstream 404 ${target.contractPath}`,
        }
      }

      if (!response.ok || !response.body) {
        await response.body?.cancel()
        return {
          success: false,
          reason: 'upstream-error',
          detail: `upstream status ${response.status} ${target.contractPath}`,
        }
      }

      // 逐块累积，超过上限就停止累积（标记 oversized）而非把整张超限图读进内存
      const { buffer, oversized } = await this.readLimited(response, ELM_IMAGE_MAX_BYTES)

      // ⚠️ 先判超限再判空：readLimited 超限时会丢弃已累积字节（buffer 为空），
      // 若先判 length===0 会把「超限」误报成「empty-body」。
      if (oversized) {
        return {
          success: false,
          reason: 'oversized',
          detail: `image > ${ELM_IMAGE_MAX_BYTES} bytes ${target.contractPath}`,
        }
      }
      if (buffer.length === 0) {
        return {
          success: false,
          reason: 'empty-body',
          detail: `empty body ${target.contractPath}`,
        }
      }

      const mime = ElmImageStorageService.validateImageBytes(buffer)
      if (!mime) {
        // 上游 200 + HTML / 文本，或响应头骗了人但字节不是图：拒绝发布（011 §4.4）
        return {
          success: false,
          reason: 'non-image-bytes',
          detail: `non-image bytes (first: ${buffer.subarray(0, 8).toString('hex')}) ${target.contractPath}`,
        }
      }

      await this.storage.saveImage(target.contractPath, buffer)
      return {
        success: true,
        bytes: buffer.length,
        contentType: mime,
      }
    }
    catch (error) {
      const aborted = controller.signal.aborted
      if (aborted) {
        return {
          success: false,
          reason: 'timeout',
          detail: `timed out after ${this.timeoutMs}ms ${target.contractPath}`,
        }
      }
      // 网络失败（fetch 抛错：DNS / 连接拒绝 / TLS / 上游 origin 不可达等）
      if (error instanceof Error && /save|write|ENOSPC|EACCES/i.test(error.message)) {
        return {
          success: false,
          reason: 'disk',
          detail: error.message,
        }
      }
      return {
        success: false,
        reason: 'network',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
    finally {
      clearTimeout(timer)
    }
  }

  /**
   * 有限读取响应 body：累积到超过 MIN_BYTES_TO_SNIFF 之后才放行超限判断，
   * 避免为了「超过上限」而把整张超限图全读进内存。
   */
  private async readLimited(response: Response, maxBytes: number): Promise<{
    buffer: Buffer
    oversized: boolean
  }> {
    const reader = response.body!.getReader()
    const chunks: Buffer[] = []
    let total = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done)
          break
        const buf = Buffer.from(value)
        total += buf.length
        // 一旦超过上限就停止累积（但标记 oversized，尽快释放上游连接）
        if (total > maxBytes) {
          await reader.cancel().catch(() => {})
          return {
            buffer: buf.subarray(0, 0),
            oversized: true,
          }
        }
        chunks.push(buf)
      }
    }
    finally {
      reader.releaseLock()
    }
    return {
      buffer: Buffer.concat(chunks),
      oversized: false,
    }
  }
}

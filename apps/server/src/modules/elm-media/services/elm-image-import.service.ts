/**
 * Elm 图片导入：盘点本地库引用的图片、去重、并发下载到本地资产目录，并支持离线 --check。
 *
 * 设计（011 §5）：
 * - 盘点来源固定（§5.1），每条引用保留「来源表 + 记录 ID + 字段名」，去重后仍可回溯所有引用方。
 * - 空引用单独统计（不当下载失败，前端走既有占位图）；未知 origin 记无效引用，不下载。
 * - 下载幂等：已完整落盘的文件跳过，只补缺失 / 损坏的，中断后重跑即可。
 * - --check 完全离线：只读本地资产，不向任一上游发请求。
 * - 不修改数据库原始 image_path；不占位图冒充原图；缺图保持 404，不静默隐藏。
 */

import type { Prisma } from '../../../generated/prisma/client'
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  CDN_CATEGORY_IMAGE_TAILS,
  FRONTEND_PLACEHOLDER_TAIL,
  looksLikeImageRef,
  resolveDbImageRef,
} from '../utils/elm-image'
import { ElmImageProxyService } from './elm-image-proxy.service'
import { ElmImageStorageService } from './elm-image-storage.service'

/** 并发下载上限（011 §4.4：同时最多 4 张 → 峰值 ~40 MiB 缓冲）。 */
const DEFAULT_CONCURRENCY = 4

/** 一条图片引用（去重键 = 契约路径，value = 该路径下所有来源）。 */
interface RefEntry {
  /** 契约路径（规范化后的唯一资产标识）。 */
  contractPath: `/${string}`
  /** 引用它的所有来源（表.记录ID.字段）。 */
  sources: string[]
}

/** 下载失败项（写入 import-result.json，可查询来源）。 */
export interface ImageFailure {
  path: string
  /** 失败分类：not-found / upstream-error / empty-body / non-image-bytes / oversized / timeout / network / disk；check 模式为 missing-local。 */
  reason: string
  detail: string
  sources: string[]
}

export interface ImageImportResult {
  mode: 'import' | 'check'
  /** 可下载的有效引用数（去重前的引用条数，空引用不计）。 */
  validRefs: number
  /** 唯一图片数。 */
  uniqueImages: number
  /** 空引用数（原字段为空，单独统计）。 */
  emptyRefs: number
  /** 无效引用数（未知 origin / 非法路径）。 */
  invalidRefs: number
  /** 本地已完整数（import 模式含本次下载成功；check 模式为离线在盘数）。 */
  localComplete: number
  /** 本次新下载成功数（check 模式恒 0，不发网络请求）。 */
  downloaded: number
  /** 本地仍缺失数（import 模式 = 下载失败 + 未覆盖；check 模式 = 在盘缺失）。 */
  missing: number
  /** 本地图片总字节。 */
  localBytes: number
  /** 失败清单（含来源与分类）。 */
  failures: ImageFailure[]
  /** 库完全为空（提示先导入商家数据）。 */
  emptyDatabase: boolean
}

type DbRef
  = | {
    ok: true
    contractPath: `/${string}`
  }
  | {
    ok: false
    reason: string
    detail: string
  }

@Injectable()
export class ElmImageImportService {
  private readonly logger = new Logger(ElmImageImportService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly proxy: ElmImageProxyService,
    private readonly storage: ElmImageStorageService,
  ) {}

  /**
   * 盘点全部图片引用，去重成 契约路径 → 来源列表。
   * 返回唯一资产表 + 空/无效引用统计。
   */
  async collectReferences(): Promise<{
    refs: Map<string, RefEntry>
    emptyRefs: number
    invalidRefs: number
    validRefs: number
  }> {
    const refs = new Map<string, RefEntry>()
    let emptyRefs = 0
    let invalidRefs = 0
    let validRefs = 0

    const add = (source: string, value: unknown, namespace: 'default' | 'cdn'): void => {
      const candidate: DbRef = value === null || value === undefined
        ? {
            ok: false,
            reason: 'empty',
            detail: '',
          }
        : resolveDbImageRef(value, namespace)

      if (!candidate.ok) {
        if (candidate.reason === 'empty') {
          emptyRefs++
        }
        else {
          invalidRefs++
        }
        return
      }

      validRefs++
      const existing = refs.get(candidate.contractPath)
      if (existing) {
        existing.sources.push(source)
      }
      else {
        refs.set(candidate.contractPath, {
          contractPath: candidate.contractPath,
          sources: [source],
        })
      }
    }

    await this.collectRestaurantRefs(add)
    await this.collectFoodRefs(add)
    await this.collectCategoryEntryRefs(add)

    // 前端公共占位图（默认源）：DB 里没有记录对应它，但前端一定会请求，必须预下载。
    add('frontend.placeholder', FRONTEND_PLACEHOLDER_TAIL, 'default')

    // food 分类页类目图（CDN 源）：同样来自服务端工厂硬编码（不在 DB），
    // CategoryPanel.vue 收口到 /img/cdn/ 后会请求它们，一并预下载。
    for (const tail of CDN_CATEGORY_IMAGE_TAILS)
      add(`frontend.food-category.${tail}`, tail, 'cdn')

    return {
      refs,
      emptyRefs,
      invalidRefs,
      validRefs,
    }
  }

  /** import 模式：盘点 + 并发下载缺失 + 写清单。 */
  async importImages(options: { concurrency?: number } = {}): Promise<ImageImportResult> {
    const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
    const { refs, emptyRefs, invalidRefs, validRefs } = await this.collectReferences()
    const entries = [...refs.values()]

    // 库空判定：没有任何可下载引用（前端预下载项除外）且本地也无任何资产。
    // 前端预下载项的契约路径 = 占位图（默认源）+ CDN_CATEGORY_IMAGE_TAILS（cdn 源）。
    const frontendOnlyPaths = new Set<string>([FRONTEND_PLACEHOLDER_TAIL])
    for (const tail of CDN_CATEGORY_IMAGE_TAILS)
      frontendOnlyPaths.add(`/cdn/${tail}`)
    const realEntries = entries.filter(e => !frontendOnlyPaths.has(e.contractPath))
    const emptyDatabase = realEntries.length === 0 && emptyRefs === 0

    // 先筛出「本地已完整」的（复用文件，跳过下载）。用轻量 isCompleteImage（只读文件头），
    // 避免为跳过检查把每张满幅图都读满 10MiB。
    const toDownload: RefEntry[] = []
    let skipped = 0
    for (const entry of entries) {
      if (await this.storage.isCompleteImage(entry.contractPath))
        skipped++
      else
        toDownload.push(entry)
    }

    // 并发下载缺失项。单张失败不中断：记录原因，末尾汇总。重跑会自然重试。
    let downloaded = 0
    const failures: ImageFailure[] = []
    await this.runPool(toDownload, concurrency, async (entry) => {
      const result = await this.proxy.downloadImage(entry.contractPath)
      if (result.success) {
        downloaded++
      }
      else {
        failures.push({
          path: entry.contractPath,
          reason: result.reason,
          detail: result.detail,
          sources: entry.sources,
        })
      }
    })

    const assets = await this.storage.listLocalAssets()
    const localBytes = assets.reduce((sum, a) => sum + a.bytes, 0)
    // 下载后重新统计本地完整数（= 跳过数 + 本次成功，但直接按磁盘实况统计更可信）。
    // 用轻量 isCompleteImage（只读文件头），不把完整大图全读一遍。
    let completeAfter = 0
    for (const entry of entries) {
      if (await this.storage.isCompleteImage(entry.contractPath))
        completeAfter++
    }

    const missing = entries.length - completeAfter

    const report = {
      mode: 'import' as const,
      generatedAt: new Date().toISOString(),
      validRefs,
      uniqueImages: entries.length,
      emptyRefs,
      invalidRefs,
      localComplete: completeAfter,
      skipped,
      downloaded,
      missing,
      localBytes,
      failures,
      emptyDatabase,
    }
    await this.storage.writeResultReport('import-result.json', report)

    const result: ImageImportResult = {
      mode: 'import',
      validRefs,
      uniqueImages: entries.length,
      emptyRefs,
      invalidRefs,
      localComplete: completeAfter,
      downloaded,
      missing,
      localBytes,
      failures,
      emptyDatabase,
    }
    this.logger.log(
      `[elm:import:images] import：有效 ${validRefs} / 唯一 ${entries.length} / 完整 ${completeAfter}`
      + ` / 本次下载 ${downloaded}（跳过已完整 ${skipped}）/ 缺失 ${missing}`
      + ` / 空引用 ${emptyRefs} / 无效 ${invalidRefs} / 本地 ${localBytes} B`,
    )
    return result
  }

  /** check 模式：纯离线盘点本地完整度，不发任何上游请求。 */
  async checkLocal(): Promise<ImageImportResult> {
    const { refs, emptyRefs, invalidRefs, validRefs } = await this.collectReferences()
    const entries = [...refs.values()]

    let localComplete = 0
    const missing: ImageFailure[] = []
    for (const entry of entries) {
      if (await this.storage.isCompleteImage(entry.contractPath)) {
        localComplete++
      }
      else {
        missing.push({
          path: entry.contractPath,
          reason: 'missing-local',
          detail: 'no complete local asset',
          sources: entry.sources,
        })
      }
    }

    const assets = await this.storage.listLocalAssets()
    const localBytes = assets.reduce((sum, a) => sum + a.bytes, 0)

    const result: ImageImportResult = {
      mode: 'check',
      validRefs,
      uniqueImages: entries.length,
      emptyRefs,
      invalidRefs,
      localComplete,
      downloaded: 0,
      missing: missing.length,
      localBytes,
      failures: missing,
      emptyDatabase: entries.length === 0 && emptyRefs === 0,
    }
    this.logger.log(
      `[elm:import:images] check（离线）：唯一 ${entries.length} / 本地完整 ${localComplete}`
      + ` / 缺失 ${missing.length} / 空引用 ${emptyRefs} / 无效 ${invalidRefs} / 本地 ${localBytes} B`,
    )
    return result
  }

  /** 库完全为空时，脚本应据此提示先导入商家数据。 */
  async isDatabaseEmpty(): Promise<boolean> {
    const [r, f, c] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.food.count(),
      this.prisma.categoryEntry.count(),
    ])
    return r === 0 && f === 0 && c === 0
  }

  private async collectRestaurantRefs(add: (source: string, value: unknown, ns: 'default' | 'cdn') => void): Promise<void> {
    const rows = await this.prisma.restaurant.findMany({
      select: {
        id: true,
        imagePath: true,
        license: true,
        identification: true,
      },
    })
    for (const row of rows) {
      const base = `Restaurant#${row.id}`
      add(`${base}.imagePath`, row.imagePath, 'default')
      this.addLicenseRefs(row.license, base, add)
      this.addIdentificationRefs(row.identification, base, add)
    }
  }

  private async collectFoodRefs(add: (source: string, value: unknown, ns: 'default' | 'cdn') => void): Promise<void> {
    const rows = await this.prisma.food.findMany({
      select: {
        itemId: true,
        imagePath: true,
      },
    })
    for (const row of rows)
      add(`Food#${row.itemId}.imagePath`, row.imagePath, 'default')
  }

  private async collectCategoryEntryRefs(add: (source: string, value: unknown, ns: 'default' | 'cdn') => void): Promise<void> {
    const rows = await this.prisma.categoryEntry.findMany({
      select: {
        id: true,
        imageUrl: true,
        iconUrl: true,
      },
    })
    for (const row of rows) {
      const base = `CategoryEntry#${row.id}`
      // 首页分类图走 /cdn/（fuss10）；绝对 URL 由 resolveDbImageRef 按 origin 转换，相对路径按 cdn 命名空间
      add(`${base}.imageUrl`, row.imageUrl, 'cdn')
      if (row.iconUrl && String(row.iconUrl).trim())
        add(`${base}.iconUrl`, row.iconUrl, 'cdn')
    }
  }

  /** license JSON 的两个已知图片字段（elm.types.ts:49）。 */
  private addLicenseRefs(license: Prisma.JsonValue, base: string, add: (s: string, v: unknown, ns: 'default' | 'cdn') => void): void {
    const obj = toJsonObject(license)
    for (const key of ['business_license_image', 'catering_service_license_image']) {
      const v = obj[key]
      if (typeof v === 'string' && v.trim())
        add(`${base}.license.${key}`, v, 'default')
    }
  }

  /**
   * identification JSON 只有泛型 Record<string, string|null>，不能假设所有字符串都是图片。
   * 用 looksLikeImageRef 保守过滤：只收集「值本身确定像图片」（URL / 图扩展名 / hash+格式名）的键。
   */
  private addIdentificationRefs(id: Prisma.JsonValue, base: string, add: (s: string, v: unknown, ns: 'default' | 'cdn') => void): void {
    const obj = toJsonObject(id)
    for (const [key, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim() && looksLikeImageRef(v))
        add(`${base}.identification.${key}`, v, 'default')
    }
  }

  /** 简单并发池：limit 个 worker 共享游标，单任务失败由 worker 内部 catch，不影响其余。 */
  private async runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
    if (items.length === 0)
      return
    let cursor = 0
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor++]

        await worker(item)
      }
    })
    await Promise.all(workers)
  }
}

/** Prisma JsonValue → 普通对象（非对象 / 数组 → {}）。 */
function toJsonObject(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value))
    return value as Record<string, unknown>
  return {}
}

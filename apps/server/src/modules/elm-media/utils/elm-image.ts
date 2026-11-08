/**
 * Elm 图片路径与字节工具（纯函数，无 I/O）。
 *
 * 本地化后有两处共用这套逻辑，必须放在一处避免分叉（对齐 upstream-url.ts 的做法）：
 * - 图片读取（ElmImageStorageService / ElmImageProxyService.getImage）：
 *   把 HTTP 契约路径校验后映射到本地文件键。
 * - 图片导入（ElmImageImportService）：把数据库里的引用规范化成「契约路径 + 上游来源」，
 *   决定该不该下载、下载到哪个键。
 *
 * 核心不变量：**契约路径**（`/api/img` 之后的规范化尾路径）是唯一的资产标识。
 * 它有两种形态，对应两条上游：
 * - 默认源：`/<tail>`        → 上游 `${ELM_API_BASE_URL}/img/<tail>`（店铺/菜品图）
 * - CDN 源：`/cdn/<tail>`    → 上游 `https://fuss10.elemecdn.com/<tail>`（首页轮播图）
 * 文件键 = sha256(契约路径)，所以 `/a.jpg` 与 `/cdn/a.jpg` 是不同资产（见 011 §4.2）。
 */

import { createHash } from 'node:crypto'

/** 默认源固定 origin。用于「绝对 URL 只认两条已知源」的盘点判定（DB 里存的是历史真实域名）。 */
export const DEFAULT_UPSTREAM_ORIGIN = 'https://elm.cangdu.org'
/** CDN 源固定 origin（轮播图，见 011 §1.1 / elm-image-proxy.service.ts:45）。 */
export const CDN_UPSTREAM_ORIGIN = 'https://fuss10.elemecdn.com'

/** 前端公共占位图（web-user config/index.js:21，默认源尾路径）。 */
export const FRONTEND_PLACEHOLDER_TAIL = '/187bcca1ec6114376.jpg'

/**
 * food 分类页类目图（CDN 源尾路径，不带 `/cdn` 前缀）。
 * 来源是服务端工厂 `createRestaurantCategory`（elm.factories.ts）硬编码的两张图，
 * 数据库与 `category_entries` 表都没有它们，但前端会确定性地请求，
 * 所以与 `FRONTEND_PLACEHOLDER_TAIL` 一样在导入命令里预下载（2026-11-07 收口补入）。
 */
export const CDN_CATEGORY_IMAGE_TAILS: readonly string[] = [
  '0e07558e305abfb2618ae760142222f9png',
  '3edf3f4ef8ed1d300896c5b9178685ebpng',
]

/** 图片命名空间。default = 店铺/菜品图（上游补 /img 前缀）；cdn = 首页轮播图（无前缀）。 */
export type ImageNamespace = 'default' | 'cdn'

export class ElmImagePathError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ElmImagePathError'
  }
}

/**
 * 校验并规范化一段「图片尾路径」（tail，不含 cdn 前缀）。
 *
 * 合法条件（011 §4.3）：
 * - 单一前导斜杠（`/a/b` 或无前导的 `a/b` 都归一成 `/a/b`）
 * - 每个段非空，且不是 `.` / `..`（拒绝路径段）
 * - 不含反斜杠（防 Windows 逃逸）、NUL 或其它 ASCII 控制字符
 * - 不含 query（`?`）或 fragment（`#`）
 * - 不接受协议相对（`//` 开头）
 *
 * HTTP 通配参数已被 Express 解码，这里不再二次解码；上面的字符拒绝即堵住
 * 残留编码 / 反斜杠 / 控制字符等逃逸。返回归一后的 `/${string}`；违反抛 ElmImagePathError。
 */
export function normalizeImageTail(raw: string): `/${string}` {
  const trimmed = raw.trim()
  if (!trimmed)
    throw new ElmImagePathError('image path is empty')
  // 协议相对（//host/...）会被解析到别的 origin，必须拒绝
  if (trimmed.startsWith('//'))
    throw new ElmImagePathError('image path must not be protocol-relative')
  if (trimmed.includes('\\'))
    throw new ElmImagePathError('image path must not contain backslash')
  if (trimmed.includes('?') || trimmed.includes('#'))
    throw new ElmImagePathError('image path must not contain query or fragment')
  // NUL(0x00) 到 0x1f 及 DEL(0x7f)。0x00 会让 C 风格文件名截断，必须拒。
  // 用 charCode 逐字判定，避免在源码里写字面控制字符。
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i)
    if (code < 0x20 || code === 0x7F)
      throw new ElmImagePathError('image path must not contain control characters')
  }

  // 去掉全部前导斜杠后补回单个，保证 single leading slash
  const noLeading = trimmed.replace(/^\/+/, '')
  if (!noLeading)
    throw new ElmImagePathError('image path is empty')
  for (const segment of noLeading.split('/')) {
    if (segment === '' || segment === '.' || segment === '..')
      throw new ElmImagePathError(`invalid image path segment: ${JSON.stringify(segment)}`)
  }

  return `/${noLeading}` as `/${string}`
}

/**
 * 判定一个字符串「是否像图片引用」，用于 identification 这类不确定 JSON 的保守过滤。
 *
 * 011 §5.1 明确：不能把 identification 里每个字符串都当路径下载（可能是身份证文字等）。
 * 只有「确定是图片」的值才放行：绝对图片 URL、带图片扩展名、或 hash 命名 + 无点格式后缀
 * （上游确有 `...f9png` 这种 hash 后直接跟 png、没点 的形态）。
 */
const IMAGE_EXT = /\.(?:jpe?g|png|webp|gif)$/i
// 纯小写字母数字，且末尾是已知图片格式名（无点）。`12345`（纯 ID）不命中，中文不命中。
const HASH_FORMAT_NAME = /^[a-z0-9]+$/

export function looksLikeImageRef(value: string): boolean {
  const v = value.trim()
  if (!v)
    return false
  if (/^https?:\/\//i.test(v))
    return true
  if (IMAGE_EXT.test(v))
    return true
  if (HASH_FORMAT_NAME.test(v))
    return /(?:jpe?g|png|webp|gif)$/i.test(v)
  return false
}

/** 盘点一个数据库引用值的结果。either 可下载（ok），或不可下载的原因（empty/unknown-origin/...）。 */
export type DbImageRefResult
  = | {
    ok: true
    contractPath: `/${string}`
    namespace: ImageNamespace
  }
  | {
    ok: false
    reason: 'empty' | 'unknown-origin' | 'invalid-url' | 'invalid-path'
    detail: string
  }

/** 已知上游源：origin + 命名空间 + 上游路径前缀（default 源上游是 /img/<tail>，cdn 源是 <tail>）。 */
const KNOWN_SOURCES: Array<{
  origin: string
  namespace: ImageNamespace
  upstreamPrefix: string
}> = [
  {
    origin: DEFAULT_UPSTREAM_ORIGIN,
    namespace: 'default',
    upstreamPrefix: '/img',
  },
  {
    origin: CDN_UPSTREAM_ORIGIN,
    namespace: 'cdn',
    upstreamPrefix: '',
  },
]

/**
 * 把数据库里的图片引用规范化成契约路径。
 *
 * @param rawValue 字段原值（可能是裸文件名 `x.jpg`、带目录 `shop/x.jpg`、带前导斜杠 `/x.jpg`，
 *   或绝对 URL `https://fuss10.elemecdn.com/2/35/x`）。
 * @param expectedNamespace 该字段的预期命名空间：绝对 URL 按 origin 自动判，相对路径才用这个兜底。
 *
 * 规则（011 §4.3 / §5.1）：
 * - 空值 → `empty`（单独统计，不当下载失败）。
 * - 绝对 URL → 只接受两条已知 origin；未知域名 `unknown-origin`，**不下载**（记无效引用）。
 * - 相对路径 → 按 expectedNamespace 补成契约路径，并做 tail 校验。
 */
export function resolveDbImageRef(rawValue: unknown, expectedNamespace: ImageNamespace): DbImageRefResult {
  const value = (rawValue === null || rawValue === undefined ? '' : String(rawValue)).trim()
  if (!value) {
    return {
      ok: false,
      reason: 'empty',
      detail: '',
    }
  }

  const isAbsolute = /^https?:\/\//i.test(value)

  if (isAbsolute) {
    let url: URL
    try {
      url = new URL(value)
    }
    catch {
      return {
        ok: false,
        reason: 'invalid-url',
        detail: value,
      }
    }
    const known = KNOWN_SOURCES.find(s => s.origin === url.origin)
    if (!known) {
      return {
        ok: false,
        reason: 'unknown-origin',
        detail: value,
      }
    }
    // 去掉该源的上游前缀得到 tail：default 源 /img/2/35/x → 2/35/x；cdn 源 /2/35/x → 2/35/x
    let p = url.pathname
    if (known.upstreamPrefix) {
      if (!p.startsWith(`${known.upstreamPrefix}/`)) {
        return {
          ok: false,
          reason: 'invalid-path',
          detail: value,
        }
      }
      p = p.slice(known.upstreamPrefix.length)
    }
    try {
      const tail = normalizeImageTail(p)
      return {
        ok: true,
        contractPath: toContractPath(tail, known.namespace),
        namespace: known.namespace,
      }
    }
    catch {
      return {
        ok: false,
        reason: 'invalid-path',
        detail: value,
      }
    }
  }

  // 相对路径：按字段预期命名空间归一
  try {
    const tail = normalizeImageTail(value)
    return {
      ok: true,
      contractPath: toContractPath(tail, expectedNamespace),
      namespace: expectedNamespace,
    }
  }
  catch {
    return {
      ok: false,
      reason: 'invalid-path',
      detail: value,
    }
  }
}

/** 契约路径 = 命名空间前缀 + 规范化尾。default: `/tail`，cdn: `/cdn/tail`。 */
function toContractPath(tail: `/${string}`, namespace: ImageNamespace): `/${string}` {
  return (namespace === 'cdn' ? `/cdn${tail}` : tail) as `/${string}`
}

/** 契约路径 → 文件键（sha256）。文件键包含 `/cdn/` 前缀，两个命名空间同名尾路径不串图。 */
export function imageAssetKey(contractPath: `/${string}`): string {
  return createHash('sha256').update(contractPath, 'utf8').digest('hex')
}

export interface ResolvedImageTarget {
  /** 规范化后的契约路径（校验通过）。 */
  contractPath: `/${string}`
  namespace: ImageNamespace
  isCdn: boolean
  /** 上游路径（default 已补 /img，cdn 无前缀），交给 resolveUpstreamUrl 做 SSRF 校验。 */
  upstreamPath: `/${string}`
  /** 文件键（sha256 契约路径）。 */
  key: string
}

/**
 * 校验契约路径并解析出上游取数信息。非法时抛 ElmImagePathError（调用方转 404 / 记无效引用）。
 *
 * @param contractPath 形如 `/187bcca1ec6114376.jpg`（默认）或 `/cdn/2/35/x`（CDN），即 `/api/img` 之后的部分。
 */
export function resolveContractPath(contractPath: string): ResolvedImageTarget {
  const isCdn = contractPath.startsWith('/cdn/')
  // cdn 前缀取掉后剩下的就是 tail；否则整段就是 tail
  const tailCandidate = isCdn ? contractPath.slice(4) : contractPath
  const tail = normalizeImageTail(tailCandidate)
  return {
    contractPath: (isCdn ? `/cdn${tail}` : tail) as `/${string}`,
    namespace: isCdn ? 'cdn' : 'default',
    isCdn,
    upstreamPath: (isCdn ? tail : `/img${tail}`) as `/${string}`,
    key: imageAssetKey((isCdn ? `/cdn${tail}` : tail) as `/${string}`),
  }
}

/**
 * 按 magic bytes 判定图片 MIME。只覆盖项目实际出现的四种格式（011 §4.4）。
 *
 * - JPEG: `FF D8 FF`
 * - PNG:  完整 8 字节签名 `89 50 4E 47 0D 0A 1A 0A`（比旧实现只校验 4 字节更严）
 * - WebP: `RIFF` + 偏移 8 的 `WEBP`（需 12 字节）
 * - GIF:  `GIF87a` / `GIF89a`
 *
 * 前 12 字节不足以判定（例如网络刚给来 3 字节的分块）时返回 null，
 * 调用方应继续累积字节再判定 —— 不要据此误判为「非图片」。
 */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

export function sniffImageMime(head: Buffer): string | null {
  if (head.length >= 3 && head[0] === 0xFF && head[1] === 0xD8 && head[2] === 0xFF)
    return 'image/jpeg'
  if (head.length >= 8 && Buffer.compare(head.subarray(0, 8), PNG_SIGNATURE) === 0)
    return 'image/png'
  if (head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp'
  if (head.length >= 6) {
    const g = head.toString('ascii', 0, 6)
    if (g === 'GIF87a' || g === 'GIF89a')
      return 'image/gif'
  }
  return null
}

/** 识别一张图片所需的最少字节数（最长签名 WebP = 12）。下载/读取用它决定累积到多少再判定。 */
export const MIN_BYTES_TO_SNIFF = 12

/**
 * 完整 buffer 的 MIME 判定（区别于分块的 sniffImageMime：这里 buffer 已拿到，可直接下结论）。
 * 合法图片返回 MIME；空 buffer 或不可识别（HTML 假图、纯文本等）返回 null。
 */
export function detectImageMime(buf: Buffer): string | null {
  if (buf.length === 0)
    return null
  return sniffImageMime(buf.subarray(0, MIN_BYTES_TO_SNIFF))
}

import { Readable } from 'node:stream'
import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { resolveUpstreamUrl, UpstreamUrlError } from '../utils/upstream-url'

export interface ProxiedImage {
  stream: Readable
  contentType: string
}

/**
 * 上游图片路径前缀。
 * ⚠️ 对外契约是 `/api/img/X`，上游真实地址是 `https://elm.cangdu.org/img/X`
 * （实测：`/img/164ad0b6a3917599.jpg` → 200，`/164ad0b6a3917599.jpg` → 404）。
 * Express 通配只捕获 `img/` 之后的部分，所以必须把 `/img` 补回去，
 * 否则会向上游请求 `/X` 而 404。
 *
 * 这是上游 elm.cangdu.org 的固定契约部分，不是部署可变量 → 用常量而非 config，
 * 避免给 elmApi 配置对象加字段（会牵动 config 测试）。将来图片字节本地化时
 * （议题 2 决策 3），这个前缀连同 fetch 逻辑一起被替换。
 */
const UPSTREAM_IMAGE_PREFIX = '/img'

/**
 * ★ 第二上游：轮播图 CDN（实测发现，方案议题 2 的遗漏）。
 *
 * web-user `msite.vue:29` 硬编码 `https://fuss10.elemecdn.com` 拼轮播图
 * （`/v2/index_entry` 返回的 image_url 形如 `/2/35/xxx.jpeg`）。实测：
 * - `https://fuss10.elemecdn.com/2/35/xxx.jpeg` → **200 image/jpeg**
 * - `https://elm.cangdu.org/img/2/35/xxx.jpeg` → **404**
 * → 轮播图与店铺图在**不同的上游**，单一 baseUrl 的代理会让轮播图全裂。
 *
 * 路由方式选**前缀路由**而非「逐个上游试到成功」：
 * - 显式：`/api/img/cdn/X` → fuss10，`/api/img/X` → elm.cangdu.org/img/X
 * - 无额外往返：顺序 fallback 会让每次首图多付一次 404 往返
 * - 契约清晰：`/api/img/*` 的默认路由行为不变（长期契约不破坏），
 *   `/img/cdn/` 是契约的**扩展**子路由；将来图片本地化时两条一起换实现
 */
const CDN_UPSTREAM_PREFIX = '/cdn'
const CDN_BASE_URL = 'https://fuss10.elemecdn.com'

/**
 * 图片代理：把上游 elm.cangdu.org 的图片字节流式转发给客户端。
 *
 * 为什么需要它（迁移方案议题 2 / 阻塞项 B）：
 * 微信小程序的 <image> 走 downloadFile 通道，同样受合法域名白名单约束，
 * 而第三方域名无法 ICP 备案 → 必须由自己后端中转。
 *
 * ⚠️ 不能复用 ElmUpstreamService：它 :55 硬编码 Accept: application/json、
 * :66 只 return response.json()，拿不到二进制流。两者共用的是
 * resolveUpstreamUrl() 的 SSRF 校验。
 *
 * 缓存策略（议题 2 决策 1）：不留副本、不落盘、不进 Redis。
 * Render free 计划磁盘临时、托管 Redis 内存昂贵且不收 Buffer；
 * 上游本身是公网 CDN，而 Cache-Control: immutable 让小程序端自己缓存一年
 * （同一用户第二次看同一张图完全不请求后端）—— 这是效果最大的一层。
 *
 * 端点 GET /api/img/* 是长期契约（议题 2 决策 2）：将来图片字节本地化时，
 * 只需把本 service 内部从「转发上游」换成「读自己的存储」，前端零改动。
 * 因此返回 { stream, contentType } 这层抽象不绑定「数据来自 fetch」这个细节。
 */
@Injectable()
export class ElmImageProxyService {
  private readonly logger = new Logger(ElmImageProxyService.name)
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('elmApi.baseUrl')
      ?? 'https://elm.cangdu.org'
    ).replace(/\/+$/, '')
    // 图片可能比 JSON 慢，单独配超时
    this.timeoutMs
      = this.configService.get<number>('elmApi.imageTimeoutMs') ?? 15000
  }

  /**
   * 取上游图片。
   *
   * @param path 形如 `/164ad0b6a3917599.jpg`（即 `/api/img` 之后的部分，
   *   可能含子目录如 `/shop/xxx.jpg`）。
   *   ★ 前缀路由（见 CDN_UPSTREAM_PREFIX 注释）：
   *   - `/cdn/X` → `https://fuss10.elemecdn.com/X`（轮播图 CDN，无前缀）
   *   - 其余 `/X` → `${baseUrl}/img/X`（店铺图/菜品图，补回 /img 前缀）
   */
  async getImage(path: `/${string}`): Promise<ProxiedImage> {
    // 前缀路由：cdn 子路由走第二上游，其余走默认上游
    const isCdn = path.startsWith(`${CDN_UPSTREAM_PREFIX}/`)
    const baseUrl = isCdn ? CDN_BASE_URL : this.baseUrl
    const restPath = isCdn ? path.slice(CDN_UPSTREAM_PREFIX.length) : path
    const upstreamPath = (isCdn
      ? restPath
      : `${UPSTREAM_IMAGE_PREFIX}${restPath}`) as `/${string}`
    let url: URL

    try {
      url = resolveUpstreamUrl(baseUrl, upstreamPath)
    }
    catch (error) {
      if (error instanceof UpstreamUrlError) {
        // 非法路径属于客户端构造问题，不该向上游发请求
        throw new NotFoundException(error.message)
      }
      // new URL(baseUrl) 本身失败 → 配置问题
      this.logger.error(
        `Invalid upstream base URL for image ${upstreamPath}`,
        error instanceof Error ? error.stack : String(error),
      )
      throw new BadGatewayException('Elm upstream base URL is invalid')
    }

    let timeout: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()

    try {
      timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      const response = await fetch(url.toString(), {
        method: 'GET',
        // ⚠️ 与 JSON 代理一致：禁止重定向，防止 302 绕过 origin 校验
        redirect: 'error',
        signal: controller.signal,
      })

      // 拿到响应头即可解除超时：流传输耗时取决于图片大小与网速，
      // 用固定超时截断会导致大图必然失败（浏览器加载图片也没有这种超时）
      clearTimeout(timeout)
      timeout = undefined

      if (response.status === 404) {
        await response.body?.cancel()
        throw new NotFoundException(`Upstream image not found for ${upstreamPath}`)
      }

      if (!response.ok || !response.body) {
        await response.body?.cancel()
        throw new BadGatewayException(
          `Upstream image request failed with status ${response.status}`,
        )
      }

      const headerType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? null
      const { stream, contentType } = await this.sniffAndWrap(response, headerType, upstreamPath)

      return {
        stream,
        contentType,
      }
    }
    catch (error) {
      if (timeout !== undefined) {
        clearTimeout(timeout)
      }
      // 已经归一化过的异常直接往上抛，不要吞成 502
      if (
        error instanceof NotFoundException
        || error instanceof BadGatewayException
      ) {
        throw error
      }
      this.logger.error(
        `Elm image proxy request failed for ${upstreamPath}`,
        error instanceof Error ? error.stack : String(error),
      )
      throw new BadGatewayException(`Elm image proxy request failed for ${upstreamPath}`)
    }
  }

  /**
   * 读首块做 magic bytes 嗅探，确定 Content-Type，再把流重组返回。
   *
   * ⚠️ 为什么不能只透传上游头（推翻本文件初版的设计）：
   * **实测 fuss10.elemecdn.com 的轮播图字节是 PNG（magic 89504E47），
   * 但响应头声称 `image/jpeg`** —— 上游 Content-Type 是错的。
   * 小程序 `<image>` 按头解码会失败或显示异常。magic bytes 才是事实。
   *
   * 判定优先级：magic bytes > 上游头（image/* 时）> 扩展名兜底 > 拒绝。
   * 头与 magic 不一致时信 magic 并 warn（便于发现上游又出新的错配）。
   *
   * ⚠️ 不能用 path.extname() 推断：上游有两种路径形态，
   * `shop/15c1513a00615.jpg`（有点）与 `0e07558e305abfb2618ae760142222f9png`
   * （hash 后直接跟 png，没有点）→ extname 对后者返回空字符串。
   *
   * 拒绝非图片：上游出错时常返回 HTML 错误页（elm.cangdu.org 对未知路径给 200+text/html），
   * 若原样转发，小程序端表现为「图片裂开」且 DevTools 里看是 200，极难排查。
   *
   * 流重组：首块已读走，用 async generator 把它与剩余块拼回一个 Readable，
   * 客户端拿到的仍是完整字节流（不缓冲整图，保持流式转发语义）。
   */
  private async sniffAndWrap(
    response: Response,
    headerType: string | null,
    path: string,
  ): Promise<ProxiedImage> {
    const reader = response.body!.getReader()

    try {
      const first = await reader.read()

      if (first.done) {
        throw new BadGatewayException(`Upstream returned empty body for ${path}`)
      }

      const head = Buffer.from(first.value as Uint8Array)
      const sniffed = sniffImageType(head)
      let contentType: string

      if (sniffed) {
        if (headerType && headerType.startsWith('image/') && headerType !== sniffed) {
          this.logger.warn(
            `Upstream content-type mismatch for ${path}: header=${headerType}, magic=${sniffed}; trusting magic bytes`,
          )
        }
        contentType = sniffed
      }
      else if (headerType && headerType.startsWith('image/')) {
        contentType = headerType
      }
      else {
        const byExtension = guessByExtension(path)
        if (!byExtension) {
          throw new BadGatewayException(
            `Upstream returned non-image content for ${path} (content-type: ${headerType ?? 'missing'})`,
          )
        }
        this.logger.warn(
          `Upstream content-type for ${path} was ${headerType ?? 'missing'} and magic unrecognized, falling back to ${byExtension}`,
        )
        contentType = byExtension
      }

      const stream = Readable.from((async function* reassemble() {
        yield head
        for (;;) {
          const chunk = await reader.read()
          if (chunk.done)
            return
          yield Buffer.from(chunk.value as Uint8Array)
        }
      })())

      return {
        stream,
        contentType,
      }
    }
    catch (error) {
      // 嗅探失败时释放上游连接，别泄漏 reader
      reader.cancel().catch(() => {})
      throw error
    }
  }
}

/** magic bytes 判定。只覆盖项目实际出现的四种格式。 */
function sniffImageType(head: Buffer): string | null {
  if (head.length >= 3 && head[0] === 0xFF && head[1] === 0xD8 && head[2] === 0xFF)
    return 'image/jpeg'
  if (head.length >= 8 && head.readUInt32BE(0) === 0x89504E47)
    return 'image/png'
  if (
    head.length >= 12
    && head.toString('ascii', 0, 4) === 'RIFF'
    && head.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  if (
    head.length >= 6
    && (head.toString('ascii', 0, 6) === 'GIF87a' || head.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return 'image/gif'
  }
  return null
}

/** 仅在扩展名可识别时兜底。⚠️ 上游有 `...f9png` 这种无点扩展名，识别不了就走不通。 */
function guessByExtension(path: string): string | null {
  const lower = path.toLowerCase()

  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  if (lower.endsWith('.png')) {
    return 'image/png'
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp'
  }
  if (lower.endsWith('.gif')) {
    return 'image/gif'
  }
  return null
}

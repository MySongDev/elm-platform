/**
 * 上游 URL 解析与 SSRF 防护。
 *
 * 从 elm-upstream.service.ts 抽取为纯函数，供 JSON 代理与图片代理共用，
 * 避免两份安全校验逻辑分叉（迁移方案议题 2）。
 *
 * 防住三类攻击：
 * - `//evil.com/x` 协议相对路径（会被解析到攻击者域名）
 * - `../../` 越界（靠 url.origin !== baseUrl.origin 兜底）
 * - 带 query/hash 的畸形 base（拼接后语义不可控）
 */

/** 解析失败时抛出的错误，由调用方转换成对应的 HTTP 异常 */
export class UpstreamUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UpstreamUrlError'
  }
}

/**
 * 把上游相对路径解析成绝对 URL。
 *
 * @param baseUrl 上游根地址（来自 ELM_API_BASE_URL）
 * @param path 以 `/` 开头的相对路径。⚠️ 类型上用模板字面量强制这一约定。
 */
export function resolveUpstreamUrl(
  baseUrl: string,
  path: `/${string}`,
): URL {
  if (path.startsWith('//')) {
    throw new UpstreamUrlError('Elm upstream path must not be protocol-relative')
  }

  const base = new URL(baseUrl)

  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new UpstreamUrlError('Elm upstream base URL must use HTTP or HTTPS')
  }
  if (base.search || base.hash) {
    throw new UpstreamUrlError('Elm upstream base URL must not contain query or fragment')
  }

  // 保证 base 以 / 结尾，否则 new URL(relative, base) 会丢掉最后一段路径
  base.pathname = `${base.pathname.replace(/\/+$/, '')}/`

  const url = new URL(path.slice(1), base)

  if (url.origin !== base.origin) {
    throw new UpstreamUrlError('Elm upstream URL changed origin')
  }

  return url
}

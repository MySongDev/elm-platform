import { IMAGE_ORIGIN_FALLBACKS } from '@/config/imageLoading'

/**
 * 根据完整图片 URL 生成候选列表（主 URL + 替换 origin 后的备用 URL）
 */
export function buildImageCandidateUrls(url, extraOrigins = IMAGE_ORIGIN_FALLBACKS) {
  if (!url || typeof url !== 'string')
    return []

  const out = []
  const seen = new Set()

  function push(u) {
    if (!u || seen.has(u))
      return
    seen.add(u)
    out.push(u)
  }

  push(url)

  let pathAndQuery = ''
  try {
    const parsed = new URL(url)
    pathAndQuery = `${parsed.pathname}${parsed.search}`
  }
  catch {
    return out
  }

  for (const origin of extraOrigins) {
    try {
      const base = new URL(origin.endsWith('/') ? origin : `${origin}/`)
      push(`${base.origin}${pathAndQuery}`)
    }
    catch {
      // ignore invalid fallback origin
    }
  }

  return out
}

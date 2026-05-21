/**
 * 图片加载：并发上限、备用域名（CDN / 源站切换）
 * 可通过环境变量覆盖主资源域；备用列表用于 onerror 逐级尝试
 */
export const IMAGE_LOAD_BASE_CONCURRENCY = Number(
  import.meta.env.VITE_IMAGE_LOAD_CONCURRENCY || 6,
)

/** 数值越小优先级越高（0 = 最高） */
export const IMAGE_PRIORITY = {
  CRITICAL: 0,
  ABOVE_THE_FOLD: 3,
  NORMAL: 10,
  BELOW: 20,
}

/**
 * 与 `getImageUrl` 结果配合：当主 host 失败时按顺序替换 origin
 * 留空则只做调度与骨架，不做域名回退
 */
export const IMAGE_ORIGIN_FALLBACKS = (
  import.meta.env.VITE_IMAGE_ORIGIN_FALLBACKS || 'https://elm.cangdu.org'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

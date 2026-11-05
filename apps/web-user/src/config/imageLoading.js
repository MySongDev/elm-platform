/**
 * 图片加载并发上限：同时交给浏览器的图片请求最多这么多张，其余排队。
 * 可用 VITE_IMAGE_LOAD_CONCURRENCY 覆盖。
 */
export const IMAGE_LOAD_BASE_CONCURRENCY = Number(
  import.meta.env.VITE_IMAGE_LOAD_CONCURRENCY || 6,
)

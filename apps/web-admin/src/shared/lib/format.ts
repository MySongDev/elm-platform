/**
 * 通用格式化工具函数
 */

/**
 * 格式化日期时间
 * @param value - 日期值（字符串、时间戳、Date 对象）
 * @param fallback - 无值时的占位符，默认 '-'
 */
export function formatDateTime(value: string | number | Date | null | undefined, fallback = '-') {
  if (!value)
    return fallback
  return new Date(value).toLocaleString()
}

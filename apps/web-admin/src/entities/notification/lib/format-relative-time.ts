const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export function formatRelativeTime(
  iso: string,
  locale: string = 'zh-CN',
  now: Date = new Date(),
): string {
  // locale 当前未参与输出；保留形参便于后续接入 i18n
  void locale
  const then = new Date(iso)
  if (Number.isNaN(then.getTime()))
    return ''

  const diffMs = now.getTime() - then.getTime()

  // 刚刚
  if (diffMs < MINUTE)
    return '刚刚'

  // X 分钟前
  if (diffMs < HOUR) {
    const minutes = Math.floor(diffMs / MINUTE)
    return `${minutes} 分钟前`
  }

  // X 小时前（同一天内）
  const isSameDay
    = then.getFullYear() === now.getFullYear()
      && then.getMonth() === now.getMonth()
      && then.getDate() === now.getDate()

  if (isSameDay) {
    const hours = Math.floor(diffMs / HOUR)
    return `${hours} 小时前`
  }

  // X 天前（7 天内）
  if (diffMs < WEEK) {
    const days = Math.floor(diffMs / DAY)
    return `${days} 天前`
  }

  // 短日期
  const month = String(then.getMonth() + 1).padStart(2, '0')
  const day = String(then.getDate()).padStart(2, '0')
  if (then.getFullYear() === now.getFullYear()) {
    return `${month}-${day}`
  }
  return `${then.getFullYear()}-${month}-${day}`
}

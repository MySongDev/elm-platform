export function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatDashboardCurrency(value: number) {
  return `¥${formatDashboardNumber(value)}`
}

export function formatDashboardPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function formatDashboardTrend(value: number) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatDashboardPercent(value)}`
}

export function formatCities(res = {}) {
  const keys = Object.keys(res).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const orderedData = {}

  keys.forEach((key) => {
    orderedData[key] = res[key]
  })

  return orderedData
}

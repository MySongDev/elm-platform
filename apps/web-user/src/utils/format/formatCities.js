export function formatCities(res = {}) {
  const keys = Object.keys(res).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  console.log(keys)

  const orderedData = {}

  keys.forEach((key) => {
    orderedData[key] = res[key]
  })

  return orderedData
}

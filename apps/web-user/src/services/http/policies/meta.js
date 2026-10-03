export function getMeta(config) {
  config.meta = config.meta || {}
  return config.meta
}

export function stableStringify(value) {
  if (value == null)
    return ''

  // FormData 不展开内容，只作占位标记 "[FormData]"
  if (value instanceof FormData) {
    return '[FormData]'
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  // 数组保持原顺序，形如 "[a,b,c]"
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  // key 先排序，使 {a:1,b:2} 与 {b:2,a:1} 都产出 "{a:1,b:2}"
  return `{${Object.keys(value)
    .sort()
    .map(key => `${key}:${stableStringify(value[key])}`)
    .join(',')}}`
}

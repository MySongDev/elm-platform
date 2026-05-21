export function getMeta(config) {
  config.meta = config.meta || {}
  return config.meta
}

export function stableStringify(value) {
  if (value == null)
    return ''

  if (value instanceof FormData) {
    return '[FormData]'
  }

  if (typeof value !== 'object') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  return `{${Object.keys(value)
    .sort()
    .map(key => `${key}:${stableStringify(value[key])}`)
    .join(',')}}`
}

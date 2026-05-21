import { getMeta, stableStringify } from './meta'

const memoryCache = new Map()

function getCacheKey(config) {
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const params = stableStringify(config.params)

  return `${method}:${url}?${params}`
}

export function getCache(config) {
  const meta = getMeta(config)

  if (!meta.cache)
    return null

  const key = getCacheKey(config)
  const cache = memoryCache.get(key)

  if (!cache)
    return null

  const maxAge = meta.cacheMaxAge || 30000

  if (Date.now() - cache.time > maxAge) {
    memoryCache.delete(key)
    return null
  }

  return cache.data
}

export function setCache(config, data) {
  const meta = getMeta(config)

  if (!meta.cache)
    return

  const key = getCacheKey(config)

  memoryCache.set(key, {
    time: Date.now(),
    data,
  })
}

export function clearHttpCache() {
  memoryCache.clear()
}

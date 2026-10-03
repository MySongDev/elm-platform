/**
 * @file HTTP 可选策略插件（缓存 / 去重 / 重试）
 * @domain services/http/extras
 * @description
 * 三段策略原先内联在 `../request.js` 的拦截器里，靠 `meta.cache / meta.dedupe / meta.retry`
 * 开关驱动。2026-10-02 全量排查确认：web-user 里从来没有任何接口开启过它们
 * （配套的 useCache / useDedupe / useRetry 除测试与 re-export 外零引用），
 * 属于占着主链路与测试面的预埋死代码，因此从 request.js 剔除，逻辑迁到本模块留档。
 *
 * 这里保留的是「拆出来的零件」，不是「装上就能跑的成品」：
 * 各策略的**执行时机**原本写在 request.js 的请求/响应拦截器里，需要在启用时
 * 手工把那几行插回去。启用步骤见 docs/engineering/010-http-optional-policies.md。
 *
 * ⚠️ 应用当前不 import 本文件，装不装都不影响任何一个请求。
 */

import axios from 'axios'

import { getMeta, stableStringify } from '../policies/meta'

// ========== 缓存 ==========
// 原 request.js: memoryCache / getCacheKey / _getCache / _setCache / clearHttpCache
// 命中的做法是在**请求拦截器**里抛一个 USE_CACHE 哨兵错误，再由响应拦截器的
// rejected 分支把它还原成正常结果——因为没有「请求拦截器直接返回响应」这条官方路径。
// 代价：哨兵错误会经过其余响应拦截器，所以缓存检查必须排在最前面。
const memoryCache = new Map()

export function getCacheKey(config) {
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const params = stableStringify(config.params)
  return `${method}:${url}?${params}`
}

export function useCache(config, options = {}) {
  const meta = getMeta(config)
  meta.cache = true
  meta.cacheMaxAge = options.maxAge || 30000
  return config
}

export function readCache(config) {
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

export function writeCache(config, data) {
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

// ========== 去重 ==========
// 原 request.js: pendingRequestMap / createRequestKey / createCanceledError
//              / useDedupe / _setupDedupe / _clearDedupe
// 两种模式：ignoreCurrent（重复的直接拒绝）、cancelPrevious（取消在飞的那个）。
const pendingRequestMap = new Map()

export function createRequestKey(config) {
  const meta = getMeta(config)
  if (meta.dedupeKey)
    return meta.dedupeKey

  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const params = stableStringify(config.params)
  const data = stableStringify(config.data)
  return `${method}:${url}?${params}:${data}`
}

function createCanceledError(message, config) {
  if (typeof axios.CanceledError === 'function') {
    return new axios.CanceledError(message, config)
  }
  const error = new Error(message)
  error.name = 'CanceledError'
  error.code = 'ERR_CANCELED'
  error.config = config
  return error
}

export function useDedupe(config, mode = 'cancelPrevious') {
  const meta = getMeta(config)
  meta.dedupe = mode // 'ignoreCurrent' | 'cancelPrevious'
  return config
}

/**
 * @description 有副作用：登记在飞请求，必要时取消上一个。重复请求走 ignoreCurrent 时**抛错**。
 */
export function beginDedupe(config) {
  const meta = getMeta(config)
  if (!meta.dedupe)
    return config

  const key = createRequestKey(config)
  meta.dedupeKey = key

  const previous = pendingRequestMap.get(key)
  if (previous) {
    if (meta.dedupe === 'ignoreCurrent') {
      throw createCanceledError('重复请求已忽略', config)
    }
    if (meta.dedupe === 'cancelPrevious') {
      previous.controller.abort()
      pendingRequestMap.delete(key)
    }
  }

  const controller = new AbortController()
  if (config.signal) {
    if (config.signal.aborted) {
      controller.abort()
    }
    else {
      config.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }
  config.signal = controller.signal
  pendingRequestMap.set(key, {
    controller,
    config,
  })
  return config
}

export function endDedupe(config) {
  if (!config)
    return
  const meta = getMeta(config)
  const key = meta.dedupeKey
  if (!key)
    return
  const pending = pendingRequestMap.get(key)
  if (pending?.config === config)
    pendingRequestMap.delete(key)
}

// ========== 重试 ==========
// 原 request.js: BASE_DELAY_MS / MAX_RETRY / useRetry / _isRetryableError / _calcRetryDelayMs
const BASE_DELAY_MS = 300
const MAX_RETRY = 3

export function useRetry(config, options = {}) {
  const meta = getMeta(config)
  meta.retry = options.maxRetries ?? MAX_RETRY
  return config
}

export function isRetryableError(error) {
  const code = error?.code
  const status = error?.response?.status
  return (
    code === 'ECONNABORTED'
    || code === 'ERR_NETWORK'
    || status === 429
    || (typeof status === 'number' && status >= 500)
  )
}

export function calcRetryDelayMs(attempt) {
  const exp = BASE_DELAY_MS * 2 ** (attempt - 1)
  const jitter = Math.floor(Math.random() * exp)
  return exp + jitter
}

/**
 * @description 无副作用：只判断「还要不要再试一次」，不改 meta。
 * @returns 下一次重试的序号（从 1 起）；返回 0 表示不该重试。
 */
export function shouldRetry(config, error) {
  const meta = getMeta(config)
  const retryLimit = meta.retry === false ? 0 : meta.retry ?? 0
  const nextRetryCount = (meta.retryCount || 0) + 1
  const method = (config.method || 'get').toLowerCase()

  const canRetry
    = method === 'get'
      && isRetryableError(error)
      && nextRetryCount <= retryLimit

  return canRetry ? nextRetryCount : 0
}

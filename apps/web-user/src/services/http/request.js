import axios from 'axios'

import { showAlert } from '@/components/common/AlterTip/index'
import { API_BASE_URL } from '@/config'
import { getStore } from '@/utils/storage/storage'

import { refreshCustomerToken } from './auth-refresh'
import { finishGlobalLoading, startGlobalLoading } from './loading'
import { handleUnauthorized } from './policies/auth'
import { getBusinessMessage, isBusinessError } from './policies/business'
import { resolveUserMessage, showHttpErrorAlert } from './policies/error-message'
import { getMeta, stableStringify } from './policies/meta'

// ========== 内联可选策略插件 ==========

// --- 缓存插件 ---
const memoryCache = new Map()

function getCacheKey(config) {
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

function _getCache(config) {
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

function _setCache(config, data) {
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

// --- 去重插件 ---
const pendingRequestMap = new Map()

function createRequestKey(config) {
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

function _setupDedupe(config) {
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

function _clearDedupe(config) {
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

// --- 重试插件 ---
const BASE_DELAY_MS = 300
const MAX_RETRY = 3

export function useRetry(config, options = {}) {
  const meta = getMeta(config)
  meta.retry = options.maxRetries ?? MAX_RETRY
  return config
}

function _isRetryableError(error) {
  const code = error?.code
  const status = error?.response?.status
  return (
    code === 'ECONNABORTED'
    || code === 'ERR_NETWORK'
    || status === 429
    || (typeof status === 'number' && status >= 500)
  )
}

function _calcRetryDelayMs(attempt) {
  const exp = BASE_DELAY_MS * 2 ** (attempt - 1)
  const jitter = Math.floor(Math.random() * exp)
  return exp + jitter
}

// --- 定位插件 ---
export function useLocation(config) {
  const meta = getMeta(config)
  meta.location = true
  return config
}

function _attachLocation(config) {
  const meta = getMeta(config)
  if (!meta.location)
    return
  try {
    const { useLocationStore } = require('@/stores/modules/store-locations')
    const locationStore = useLocationStore()
    if (locationStore.latitude == null || locationStore.longitude == null)
      return
    config.headers = config.headers || {}
    config.headers['X-Latitude'] = String(locationStore.latitude)
    config.headers['X-Longitude'] = String(locationStore.longitude)
  }
  catch (e) {
    // store 未就绪时静默忽略
  }
}

// ========== Axios 实例 ==========
export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ========== 请求拦截器 ==========
request.interceptors.request.use(
  (config) => {
    const meta = getMeta(config)

    // 缓存命中：直接返回缓存数据，跳过网络请求
    const cachedData = _getCache(config)
    if (cachedData) {
      meta.useCache = true
      const cacheHitError = new Error('Use cached response')
      cacheHitError.code = 'USE_CACHE'
      cacheHitError.config = config
      cacheHitError.data = cachedData
      return Promise.reject(cacheHitError)
    }

    meta.traceId = meta.traceId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    meta.attemptId = meta.traceId
    meta.startTime = Date.now()

    // 可选策略：去重
    if (meta.dedupe)
      _setupDedupe(config)
    // 可选策略：定位
    if (meta.location)
      _attachLocation(config)

    // Token 注入
    const token = getStore('customer_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    startGlobalLoading(config)
    return config
  },
  (error) => {
    finishGlobalLoading(error?.config)
    return Promise.reject(error)
  },
)

// ========== 响应拦截器 ==========
request.interceptors.response.use(
  (response) => {
    const config = response.config
    if (config) {
      _clearDedupe(config)
      finishGlobalLoading(config)
    }

    // 业务错误码处理
    if (isBusinessError(response.data)) {
      const message = getBusinessMessage(response.data)
      showAlert(message)
      const error = new Error(message)
      error.name = response.data?.name || 'BusinessError'
      error.code = response.data?.code ?? response.data?.status
      error.isBusinessError = true
      error.response = response
      return Promise.reject(error)
    }

    // 缓存成功响应
    if (getMeta(config).cache)
      _setCache(config, response.data)

    return response.data
  },
  async (error) => {
    // 缓存命中：直接返回缓存数据
    if (error?.code === 'USE_CACHE') {
      return Promise.resolve(error.data)
    }

    const config = error?.config
    const meta = config ? getMeta(config) : {}
    const method = (config?.method || 'get').toLowerCase()
    const status = error?.response?.status
    const code = error?.code
    const userMessage = resolveUserMessage(error)

    _clearDedupe(config)

    // 可选策略：重试（仅 GET、可重试错误、未超限）
    const retryLimit = meta.retry === false ? 0 : meta.retry ?? 0
    const nextRetryCount = (meta.retryCount || 0) + 1
    const canRetry
      = !!config
        && method === 'get'
        && _isRetryableError(error)
        && nextRetryCount <= retryLimit

    if (canRetry) {
      meta.retryCount = nextRetryCount
      finishGlobalLoading(config)
      const delay = _calcRetryDelayMs(nextRetryCount)
      await new Promise(resolve => setTimeout(resolve, delay))
      return request(config)
    }

    // 401：尝试刷新 Token
    if (status === 401 && config && !meta.skipAuthRefresh && !meta.authRetried) {
      meta.authRetried = true
      finishGlobalLoading(config)
      const nextToken = await refreshCustomerToken(request).catch(() => null)
      if (nextToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${nextToken}`
        return request(config)
      }
    }

    finishGlobalLoading(config)

    // 错误提示
    if (status === 401) {
      handleUnauthorized(error)
    }
    else if (code !== 'ERR_CANCELED') {
      showHttpErrorAlert(userMessage, status)
    }

    // 开发环境日志
    if (import.meta.env.DEV && code !== 'ERR_CANCELED') {
      console.error('[HTTP_ERROR]', {
        traceId: meta.traceId,
        attemptId: meta.attemptId,
        url: config?.url,
        method: config?.method,
        status,
        code,
        retryCount: meta.retryCount || 0,
        error,
      })
    }

    return Promise.reject(error)
  },
)

// ========== 导出便捷方法 ==========
export function get(url, params, options = {}) {
  return request({
    url,
    method: 'get',
    params,
    ...options,
  })
}

export function post(url, data, options = {}) {
  return request({
    url,
    method: 'post',
    data,
    ...options,
  })
}

export function put(url, data, options = {}) {
  return request({
    url,
    method: 'put',
    data,
    ...options,
  })
}

export function patch(url, data, options = {}) {
  return request({
    url,
    method: 'patch',
    data,
    ...options,
  })
}

export function del(url, data, options = {}) {
  return request({
    url,
    method: 'delete',
    data,
    ...options,
  })
}

export { request as httpRequest }

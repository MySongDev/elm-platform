/**
 * HTTP 请求层 —— 与 web-user 的 services/http/request.js 同职责，传输层换成 uni.request。
 *
 * ⚠️ 与 apps/web-user/src/services/http/request.js 同源（策略语义一致），
 * 但传输实现完全不同：web-user 是 400 行 axios 拦截器，这里是 platform/request.ts
 * （uni.request 封装）之上的策略编排。修改策略语义需同步两处。
 *
 * axios 能力 → 本实现的映射（迁移方案 F 节）：
 * | axios（web-user） | 本文件 |
 * |---|---|
 * | `axios.create({baseURL,timeout})` | platform/request.ts 的 resolveUrl + timeout 传参 |
 * | `interceptors.request/response` | 本文件的 sendWithPolicies 前置/后置钩子 |
 * | `AbortController` + signal | transport 的 `signal → RequestTask.abort()` |
 * | `axios.CanceledError` | transport 的 `CanceledError` 类 |
 * | `withCredentials: true` | **直接去掉**（token 全走 storage，全库无 cookie 依赖） |
 *
 * ⚠️ 小程序端 request 的硬限制（Batch 0 第 4 项验证）：
 * - 并发上限 10 个 wx.request → dedupe 策略在此更有价值
 * - 不支持 cookie / 自定义 UA
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/config'
import { getLocationWithTimeout } from '@/platform/location'
import { CanceledError, send, TransportError } from '@/platform/request'
import { refreshCustomerToken } from './auth-refresh'
import { getAccessToken } from './auth-storage'
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

/**
 * 构造取消错误。
 * ⚠️ web-user 用 axios.CanceledError；这里用 transport 的 CanceledError 类，
 * policies 的取消判定改判 `instanceof CanceledError`（见 error-message.js）。
 */
function createCanceledError(message, config) {
  const error = new CanceledError(message)
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
      previous.abort()
      pendingRequestMap.delete(key)
    }
  }

  // ⚠️ 与 web-user 的差异：web-user 在此新建 AbortController 并接管 config.signal；
  // uni-user 的 transport 已支持外部 signal，这里复用同一个 controller 以便
  // 「取消前一个」与「调用方主动取消」都能生效。
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
    abort: () => controller.abort(),
    config,
  })
  return config
}

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

/**
 * 判定是否可重试。
 * ⚠️ 判定依据换成 transport 的统一错误结构（同 error-message.js 的理由）：
 * web-user 看 axios 的 code（ECONNABORTED/ERR_NETWORK）与 error.response.status。
 */
function _isRetryableError(error) {
  if (error instanceof TransportError) {
    return error.isTimeout
      || error.isNetworkError
      || error.status === 429
      || (typeof error.status === 'number' && error.status >= 500)
  }
  return false
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

/**
 * 注入经纬度请求头。
 * ⚠️ 与 web-user 的关键差异：web-user 从 store-locations **同步**读缓存坐标；
 * 小程序端定位是异步的（uni.getLocation），这里改为「有缓存坐标才注入，
 * 没有则发起一次异步定位并等待」—— 否则位置相关接口会静默拿到空坐标
 * （web-user 的 store 有浏览器定位兜底，小程序端没有）。
 */
async function _attachLocation(config) {
  const meta = getMeta(config)
  if (!meta.location)
    return

  // 优先用 store 里的缓存坐标（store-locations 迁移后提供），避免每次请求都定位
  let { latitude, longitude } = readCachedLocation()

  if (latitude == null || longitude == null) {
    const located = await getLocationWithTimeout(5000)
    latitude = located?.latitude
    longitude = located?.longitude
  }

  if (latitude == null || longitude == null)
    return

  config.header = config.header || {}
  config.header['X-Latitude'] = String(latitude)
  config.header['X-Longitude'] = String(longitude)
}

/**
 * 读缓存坐标。
 * ⚠️ 用动态 require 风格的惰性读取避免循环依赖：store-locations 依赖本层发请求，
 * 本层又需要它的坐标。web-user 用 require() 解决，小程序端用惰性 import 的同步替代 ——
 * 直接读 storage 里的定位快照（store-locations 的 persist 落盘格式），零依赖。
 */
function readCachedLocation() {
  try {
    const cache = uni.getStorageSync('location')
    if (!cache)
      return {}
    const parsed = typeof cache === 'string' ? JSON.parse(cache) : cache
    return {
      latitude: parsed?.latitude ?? null,
      longitude: parsed?.longitude ?? null,
    }
  }
  catch {
    return {}
  }
}

// ========== 核心请求 ==========

/**
 * 带策略的请求。对应 web-user 的 axios 实例 + 两个拦截器。
 *
 * 流程（与 web-user 拦截器顺序对齐）：
 * 1. 缓存命中 → 直接返回
 * 2. 去重 / 定位 / token 注入 / loading 开始
 * 3. 发送
 * 4. 业务错误码判定 → 抛 BusinessError
 * 5. 缓存写入
 * 6. 失败：重试 → 401 刷新 → 错误提示 → reject
 */
export async function request(options = {}) {
  const config = {
    ...options,
    method: (options.method || 'get').toUpperCase(),
  }
  const meta = getMeta(config)

  // 1. 缓存命中
  const cachedData = _getCache(config)
  if (cachedData) {
    return cachedData
  }

  meta.traceId = meta.traceId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  meta.attemptId = meta.traceId
  meta.startTime = Date.now()

  // 2. 前置策略
  if (meta.dedupe)
    _setupDedupe(config)
  if (meta.location)
    await _attachLocation(config)

  const token = getAccessToken()
  if (token) {
    config.header = config.header || {}
    config.header.Authorization = `Bearer ${token}`
  }

  startGlobalLoading(config)

  try {
    const response = await send({
      url: config.url,
      method: config.method,
      // GET 的参数走 params（transport 序列化进 query），其余走 data（请求体）
      params: config.method === 'GET' ? config.params : undefined,
      data: config.method === 'GET' ? undefined : config.data,
      header: config.header,
      timeout: config.timeout ?? REQUEST_TIMEOUT,
      signal: config.signal,
      upload: config.upload,
    }).promise

    _clearDedupe(config)
    finishGlobalLoading(config)

    const payload = response.data

    // 4. 业务错误码
    if (isBusinessError(payload)) {
      const message = getBusinessMessage(payload)
      showHttpErrorAlert(message, response.status)
      const error = new Error(message)
      error.name = payload?.name || 'BusinessError'
      error.code = payload?.code ?? payload?.status
      error.isBusinessError = true
      error.response = response
      throw error
    }

    // 5. 缓存写入
    if (meta.cache)
      _setCache(config, payload)

    return payload
  }
  catch (error) {
    _clearDedupe(config)

    const method = (config.method || 'get').toLowerCase()
    const status = error instanceof TransportError ? error.status : undefined
    const userMessage = resolveUserMessage(error)

    // 6a. 重试（仅 GET、可重试错误、未超限）
    const retryLimit = meta.retry === false ? 0 : meta.retry ?? 0
    const nextRetryCount = (meta.retryCount || 0) + 1
    const canRetry
      = method === 'get'
        && _isRetryableError(error)
        && nextRetryCount <= retryLimit

    if (canRetry) {
      meta.retryCount = nextRetryCount
      finishGlobalLoading(config)
      const delay = _calcRetryDelayMs(nextRetryCount)
      await new Promise(resolve => setTimeout(resolve, delay))
      return request(config)
    }

    // 6b. 401：尝试刷新 token（后端 /customer-auth/refresh 仍存在）
    if (status === 401 && !meta.skipAuthRefresh && !meta.authRetried) {
      meta.authRetried = true
      finishGlobalLoading(config)
      const nextToken = await refreshCustomerToken(request).catch(() => null)
      if (nextToken) {
        config.header = config.header || {}
        config.header.Authorization = `Bearer ${nextToken}`
        return request(config)
      }
    }

    finishGlobalLoading(config)

    // 6c. 错误提示。meta.silent 只静默弹窗，不影响 401 刷新/重试
    //     （见 memory: project-elm-http-silent-meta）
    if (status === 401) {
      handleUnauthorized(error)
    }
    else if (!(error instanceof CanceledError) && !meta.silent) {
      showHttpErrorAlert(userMessage, status)
    }

    // 开发环境日志
    if (import.meta.env.DEV && !(error instanceof CanceledError)) {
      console.error('[HTTP_ERROR]', {
        traceId: meta.traceId,
        attemptId: meta.attemptId,
        url: config.url,
        method: config.method,
        status,
        retryCount: meta.retryCount || 0,
        error,
      })
    }

    throw error
  }
}

// ========== 导出便捷方法 ==========
// ⚠️ 不提供 patch()：uni.request 不支持 PATCH 方法（type-check 实测），
// 且用户端接口零 PATCH。见 platform/request.ts 的 TransportMethod 注释。

export function get(url, params, options = {}) {
  return request({
    url,
    method: 'GET',
    params,
    ...options,
  })
}

export function post(url, data, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options,
  })
}

export function put(url, data, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options,
  })
}

export function del(url, data, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options,
  })
}

export { API_BASE_URL, request as httpRequest }

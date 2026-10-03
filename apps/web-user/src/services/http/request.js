import axios from 'axios'

import { showAlert } from '@/components/common/AlterTip/index'
import { API_BASE_URL } from '@/config'

import { refreshCustomerToken } from './auth-refresh'
import { getAccessToken } from './auth-storage'
import { finishGlobalLoading, startGlobalLoading } from './loading'
import { handleUnauthorized } from './policies/auth'
import { getBusinessMessage, isBusinessError } from './policies/business'
import { resolveUserMessage, showHttpErrorAlert } from './policies/error-message'
import { getMeta } from './policies/meta'

// ========== 可选策略：定位 ==========
// 缓存 / 去重 / 重试三段策略原先内联在本文件，2026-10-02 因项目内从无接口启用（占着主链路与
// 测试面的预埋死代码）而剔除。逻辑留档在 ./extras/optional-policies.js，
// 要重新启用时的接入步骤见 docs/engineering/010-http-optional-policies.md。

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
  catch {
    // store 未就绪时静默忽略
  }
}

// ========== Axios 实例 ==========
// 不写死 Content-Type：交给 axios 按 body 类型自动推断——对象 body 自动 application/json，
// FormData 自动 multipart/form-data（含 boundary），GET 无 body 则不带该头。
// 若写死 application/json，transformRequest 会把 FormData 误序列化成 JSON 导致文件丢失。
// Accept 与 body 序列化无关，保留以声明期望的响应类型。
export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
})

// ========== 请求拦截器 ==========
request.interceptors.request.use(
  (config) => {
    const meta = getMeta(config)

    meta.traceId = meta.traceId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    meta.attemptId = meta.traceId
    meta.startTime = Date.now()

    // 可选策略：定位
    if (meta.location)
      _attachLocation(config)

    // Token 注入
    const token = getAccessToken()
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
    finishGlobalLoading(response.config)

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

    return response.data
  },
  async (error) => {
    const config = error?.config
    const meta = config ? getMeta(config) : {}
    const status = error?.response?.status
    const code = error?.code
    const userMessage = resolveUserMessage(error)

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
    // meta.silent：跳过全局错误弹窗，交由调用方自行 catch 提示（如支付流程，避免双重弹窗）。
    // 注意 silent 只静默弹窗，不影响 401 刷新/跳登录等策略。
    if (status === 401) {
      handleUnauthorized(error)
    }
    else if (code !== 'ERR_CANCELED' && !meta.silent) {
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

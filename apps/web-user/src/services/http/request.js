import axios from 'axios'

import { showAlert } from '@/components/common/AlterTip/index'
import { API_BASE_URL } from '@/config'
import { getStore } from '@/untils/storage'

import { refreshCustomerToken } from './auth-refresh'
import { finishGlobalLoading, startGlobalLoading } from './loading'
import {
  addBusinessErrorLog,
  addHttpErrorLog,
  createRequestId,
  getNow,
} from './log'
import {
  attachLocation,
  calcRetryDelayMs,
  clearDedupe,
  getBusinessMessage,
  getCache,
  getMeta,
  handleUnauthorized,
  isBusinessError,
  isRetryableError,
  resolveUserMessage,
  setCache,
  setupDedupe,
  showHttpErrorAlert,
} from './policies'

const MAX_RETRY = 3

export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

request.interceptors.request.use(
  (config) => {
    const meta = getMeta(config)
    const cachedData = getCache(config)

    if (cachedData) {
      meta.useCache = true
      const cacheHitError = new Error('Use cached response')
      cacheHitError.code = 'USE_CACHE'
      cacheHitError.config = config
      cacheHitError.data = cachedData

      return Promise.reject(cacheHitError)
    }

    meta.traceId = meta.traceId || createRequestId()
    meta.attemptId = createRequestId()
    meta.startTime = getNow()

    setupDedupe(config)
    attachLocation(config)
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

request.interceptors.response.use(
  (response) => {
    const config = response.config

    clearDedupe(config)
    finishGlobalLoading(config)

    if (isBusinessError(response.data)) {
      const message = getBusinessMessage(response.data)

      showAlert(message)
      addBusinessErrorLog({
        response,
        message,
      })

      const error = new Error(message)
      error.name = response.data?.name || 'BusinessError'
      error.code = response.data?.code ?? response.data?.status
      error.isBusinessError = true
      error.response = response

      return Promise.reject(error)
    }

    setCache(config, response.data)

    return response.data
  },
  async (error) => {
    if (error?.code === 'USE_CACHE') {
      return Promise.resolve(error.data)
    }
    const config = error?.config
    const meta = config ? getMeta(config) : {}
    const method = (config?.method || '').toLowerCase()
    const status = error?.response?.status
    const code = error?.code
    const userMessage = resolveUserMessage(error)

    clearDedupe(config)

    const retryLimit = meta.retry === false ? 0 : meta.retry ?? MAX_RETRY
    const nextRetryCount = (meta.retryCount || 0) + 1
    const canRetry
      = !!config
        && method === 'get'
        && isRetryableError(error)
        && nextRetryCount <= retryLimit

    if (canRetry) {
      meta.retryCount = nextRetryCount
      finishGlobalLoading(config)

      const delay = calcRetryDelayMs(nextRetryCount)
      await new Promise(resolve => setTimeout(resolve, delay))

      return request(config)
    }

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

    if (status === 401) {
      handleUnauthorized(error)
    }
    else if (code !== 'ERR_CANCELED') {
      showHttpErrorAlert(userMessage, status)
    }

    if (code !== 'ERR_CANCELED') {
      addHttpErrorLog({
        error,
        message: userMessage,
      })
    }

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

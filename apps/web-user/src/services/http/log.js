import { addErrorLog } from '@/utils/storage/logger'

import { getMeta } from './policies'

const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'phone',
  'mobile',
  'address',
  'latitude',
  'longitude',
]

export function getNow() {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }

  return Date.now()
}

export function createRequestId() {
  return `${getNow().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isSensitiveKey(key) {
  const lowerKey = String(key).toLowerCase()
  return SENSITIVE_KEYS.some(item => lowerKey.includes(item))
}

export function sanitizeLogData(data, depth = 0) {
  if (data == null)
    return data

  if (depth > 3) {
    return '[MaxDepth]'
  }

  if (typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.slice(0, 5).map(item => sanitizeLogData(item, depth + 1))
  }

  const result = {}

  Object.keys(data).forEach((key) => {
    result[key] = isSensitiveKey(key)
      ? '[Filtered]'
      : sanitizeLogData(data[key], depth + 1)
  })

  return result
}

export function getCurrentRouteContext() {
  if (typeof window === 'undefined')
    return undefined

  return {
    fullPath:
      window.location.hash?.replace(/^#/, '')
      || window.location.pathname + window.location.search,
    title: document.title,
    timestamp: Date.now(),
  }
}

export function addBusinessErrorLog({ response, message }) {
  const config = response.config
  const meta = getMeta(config)

  addErrorLog({
    type: 'business_error',
    traceId: meta.traceId,
    attemptId: meta.attemptId,
    url: config.url,
    method: config.method,
    status: response.status,
    retryCount: meta.retryCount || 0,
    durationMs: Math.round(getNow() - meta.startTime),
    route: getCurrentRouteContext(),
    responseData: sanitizeLogData(response.data),
    message,
  })
}

export function addHttpErrorLog({ error, message }) {
  const config = error?.config
  const meta = config ? getMeta(config) : {}

  addErrorLog({
    type: 'http_error',
    traceId: meta.traceId,
    attemptId: meta.attemptId,
    url: config?.url,
    method: config?.method,
    params: sanitizeLogData(config?.params),
    baseURL: config?.baseURL,
    status: error?.response?.status,
    code: error?.code,
    retryCount: meta.retryCount || 0,
    durationMs:
      typeof meta.startTime === 'number'
        ? Math.round(getNow() - meta.startTime)
        : undefined,
    route: getCurrentRouteContext(),
    responseMessage: error?.response?.data?.message,
    responseData: sanitizeLogData(error?.response?.data),
    message,
  })
}

import axios from 'axios'

import { getMeta, stableStringify } from './meta'

const pendingRequestMap = new Map()

function createRequestKey(config) {
  const meta = getMeta(config)

  if (meta.dedupeKey) {
    return meta.dedupeKey
  }

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

export function setupDedupe(config) {
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
      config.signal.addEventListener(
        'abort',
        () => {
          controller.abort()
        },
        { once: true },
      )
    }
  }

  config.signal = controller.signal
  pendingRequestMap.set(key, {
    controller,
    config,
  })

  return config
}

export function clearDedupe(config) {
  if (!config)
    return

  const meta = getMeta(config)
  const key = meta.dedupeKey

  if (!key)
    return

  const pending = pendingRequestMap.get(key)

  if (pending?.config === config) {
    pendingRequestMap.delete(key)
  }
}

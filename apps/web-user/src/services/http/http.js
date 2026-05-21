import { clearHttpCache, setUnauthorizedHandler } from './policies'
import { request } from './request'

export function http(options = {}) {
  const {
    url = '',
    method = 'get',
    data,
    params,

    loading = true,
    loadingText,
    loadingDelay,
    loadingMinDuration,

    location = false,
    retry,
    dedupe,
    dedupeKey,

    cache = false,
    cacheMaxAge,

    ...rest
  } = options

  const normalizedMethod = method.toLowerCase()

  return request({
    url,
    method: normalizedMethod,
    [normalizedMethod === 'get' ? 'params' : 'data']:
      normalizedMethod === 'get' ? params : data,

    ...rest,

    meta: {
      ...(rest.meta || {}),

      loading,
      loadingText,
      loadingDelay,
      loadingMinDuration,

      location,
      retry,
      dedupe,
      dedupeKey,

      cache,
      cacheMaxAge,
    },
  })
}

export function get(url, params, options = {}) {
  return http({
    url,
    method: 'get',
    params,
    ...options,
  })
}

export function post(url, data, options = {}) {
  return http({
    url,
    method: 'post',
    data,
    ...options,
  })
}

export function put(url, data, options = {}) {
  return http({
    url,
    method: 'put',
    data,
    ...options,
  })
}

export function patch(url, data, options = {}) {
  return http({
    url,
    method: 'patch',
    data,
    ...options,
  })
}

export function del(url, data, options = {}) {
  return http({
    url,
    method: 'delete',
    data,
    ...options,
  })
}

export { clearHttpCache, request, setUnauthorizedHandler }

// ⚠️ 与 apps/web-user/src/services/http/http.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// 差异：
// 1. method 传大写（uni.request 要求），web-user 传小写（axios 不区分）
// 2. 不提供 patch()：uni.request 不支持 PATCH（见 platform/request.ts 注释）
// 3. GET 的参数走 params（transport 拼 query），其余走 data（请求体）

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

  const normalizedMethod = method.toUpperCase()

  return request({
    url,
    method: normalizedMethod,
    [normalizedMethod === 'GET' ? 'params' : 'data']:
      normalizedMethod === 'GET' ? params : data,

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

export function del(url, data, options = {}) {
  return http({
    url,
    method: 'delete',
    data,
    ...options,
  })
}

export { clearHttpCache, request, setUnauthorizedHandler }

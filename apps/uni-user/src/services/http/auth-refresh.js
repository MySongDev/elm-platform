// ⚠️ 与 apps/web-user/src/services/http/auth-refresh.js 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
//
// ⚠️ 后端 /customer-auth/refresh 仍然存在（customer-auth.controller.ts:61）。
// e3b1dd4 删的是前端「无调用方的包装函数 customerRefreshToken」，不是后端路由，
// 也不是本文件的 401 自动刷新逻辑 —— 那部分必须保留。

import { authEndpoints } from '@/services/api/endpoints/auth.endpoints'

import { getRefreshToken, persistAuthTokens } from './auth-storage'

let refreshPromise = null

function unwrapResponse(payload) {
  return payload?.data && payload.code === 200 ? payload.data : payload
}

function persistTokens(payload) {
  const data = unwrapResponse(payload)
  const accessToken = data?.accessToken || data?.token

  persistAuthTokens({
    accessToken,
    refreshToken: data?.refreshToken,
    expiresIn: data?.expiresIn,
    refreshExpiresIn: data?.refreshExpiresIn,
  })

  return accessToken
}

/**
 * 刷新令牌。并发 401 时复用同一个 promise（refreshPromise 单飞），
 * 避免多个请求各自刷新导致 refresh token 被消费多次。
 *
 * @param {Function} requestFn 注入的请求函数（request.js 的 request），
 *   避免本文件直接依赖 request 造成循环依赖
 */
export async function refreshCustomerToken(requestFn) {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  refreshPromise = requestFn({
    url: authEndpoints.customerRefresh,
    method: 'POST',
    data: { refreshToken },
    meta: {
      skipAuthRefresh: true,
      loading: false,
      retry: false,
      dedupe: false,
    },
  })
    .then(persistTokens)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

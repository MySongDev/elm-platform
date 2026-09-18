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

export async function refreshCustomerToken(request) {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  refreshPromise = request({
    url: authEndpoints.customerRefresh,
    method: 'post',
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

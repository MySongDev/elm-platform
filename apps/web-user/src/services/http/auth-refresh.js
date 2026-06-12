import { authEndpoints } from '@/services/api/endpoints/auth.endpoints'
import { getStore, setStore } from '@/utils/storage/storage'

const ACCESS_TOKEN_KEY = 'customer_token'
const REFRESH_TOKEN_KEY = 'customer_refresh_token'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'customer_token_expires_at'
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'customer_refresh_token_expires_at'

let refreshPromise = null

function unwrapResponse(payload) {
  return payload?.data && payload.code === 200 ? payload.data : payload
}

function persistAuthTokens(payload) {
  const data = unwrapResponse(payload)
  const accessToken = data?.accessToken || data?.token

  if (accessToken) {
    setStore(ACCESS_TOKEN_KEY, accessToken)
  }
  if (data?.refreshToken) {
    setStore(REFRESH_TOKEN_KEY, data.refreshToken)
  }
  if (data?.expiresIn) {
    setStore(ACCESS_TOKEN_EXPIRES_AT_KEY, String(Date.now() + data.expiresIn * 1000))
  }
  if (data?.refreshExpiresIn) {
    setStore(REFRESH_TOKEN_EXPIRES_AT_KEY, String(Date.now() + data.refreshExpiresIn * 1000))
  }

  return accessToken
}

export async function refreshCustomerToken(request) {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getStore(REFRESH_TOKEN_KEY)
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
    .then(persistAuthTokens)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

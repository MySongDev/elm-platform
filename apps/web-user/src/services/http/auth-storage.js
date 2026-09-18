import { getStore, removeStore, setStore } from '@/utils/storage/storage'

export const ACCESS_TOKEN_KEY = 'customer_token'
export const REFRESH_TOKEN_KEY = 'customer_refresh_token'
export const ACCESS_TOKEN_EXPIRES_AT_KEY = 'customer_token_expires_at'
export const REFRESH_TOKEN_EXPIRES_AT_KEY = 'customer_refresh_token_expires_at'
export const USER_ID_KEY = 'user_id'

function toTimestamp(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * 读取本地会话快照。
 * 这里是令牌与用户标识的唯一读取入口，其他模块不得再自行拼接 key 读取，
 * 否则 key 一旦变更就会出现静默不一致。
 */
export function readAuthSession() {
  return {
    accessToken: getStore(ACCESS_TOKEN_KEY) || '',
    refreshToken: getStore(REFRESH_TOKEN_KEY) || '',
    accessTokenExpiresAt: toTimestamp(getStore(ACCESS_TOKEN_EXPIRES_AT_KEY)),
    refreshTokenExpiresAt: toTimestamp(getStore(REFRESH_TOKEN_EXPIRES_AT_KEY)),
    userId: String(getStore(USER_ID_KEY) || ''),
  }
}

export function getAccessToken() {
  return getStore(ACCESS_TOKEN_KEY) || ''
}

export function getRefreshToken() {
  return getStore(REFRESH_TOKEN_KEY) || ''
}

export function persistUserId(userId) {
  setStore(USER_ID_KEY, String(userId || ''))
}

/**
 * 写入令牌。expiresIn / refreshExpiresIn 由后端以「秒」返回，这里换算成绝对时间戳落库。
 */
export function persistAuthTokens({ accessToken, refreshToken, expiresIn, refreshExpiresIn } = {}) {
  if (accessToken)
    setStore(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken)
    setStore(REFRESH_TOKEN_KEY, refreshToken)
  if (expiresIn)
    setStore(ACCESS_TOKEN_EXPIRES_AT_KEY, Date.now() + expiresIn * 1000)
  if (refreshExpiresIn)
    setStore(REFRESH_TOKEN_EXPIRES_AT_KEY, Date.now() + refreshExpiresIn * 1000)
}

export function clearAuthSession() {
  removeStore(ACCESS_TOKEN_KEY)
  removeStore(REFRESH_TOKEN_KEY)
  removeStore(ACCESS_TOKEN_EXPIRES_AT_KEY)
  removeStore(REFRESH_TOKEN_EXPIRES_AT_KEY)
  removeStore(USER_ID_KEY)
}

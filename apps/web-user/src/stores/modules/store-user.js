import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getUserInfo as getUserInfoApi } from '@/services/api'
import { getStore, removeStore, setStore } from '@/untils/storage'

const ACCESS_TOKEN_KEY = 'customer_token'
const REFRESH_TOKEN_KEY = 'customer_refresh_token'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'customer_token_expires_at'
const REFRESH_TOKEN_EXPIRES_AT_KEY = 'customer_refresh_token_expires_at'
const USER_ID_KEY = 'user_id'

function getNumberStore(key) {
  const value = Number(getStore(key) || 0)
  return Number.isFinite(value) ? value : 0
}

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref({})
  const isLogin = ref(false)
  const userId = ref(String(getStore(USER_ID_KEY) || ''))
  const userName = ref('')
  const lastFetchTime = ref(0)
  const customerToken = ref(getStore(ACCESS_TOKEN_KEY) || '')
  const customerRefreshToken = ref(getStore(REFRESH_TOKEN_KEY) || '')
  const customerTokenExpiresAt = ref(getNumberStore(ACCESS_TOKEN_EXPIRES_AT_KEY))
  const customerRefreshTokenExpiresAt = ref(getNumberStore(REFRESH_TOKEN_EXPIRES_AT_KEY))

  // 计算属性
  const userAvatar = computed(() => userInfo.value.avatar || '')
  const isTokenFresh = computed(() =>
    Boolean(customerToken.value && customerTokenExpiresAt.value > Date.now()),
  )
  const hasRefreshSession = computed(() =>
    Boolean(customerRefreshToken.value && customerRefreshTokenExpiresAt.value > Date.now()),
  )

  // Actions
  const logout = () => {
    userInfo.value = {}
    userId.value = ''
    userName.value = ''
    isLogin.value = false
    lastFetchTime.value = 0
    customerToken.value = ''
    customerRefreshToken.value = ''
    customerTokenExpiresAt.value = 0
    customerRefreshTokenExpiresAt.value = 0
    removeStore(USER_ID_KEY)
    removeStore(ACCESS_TOKEN_KEY)
    removeStore(REFRESH_TOKEN_KEY)
    removeStore(ACCESS_TOKEN_EXPIRES_AT_KEY)
    removeStore(REFRESH_TOKEN_EXPIRES_AT_KEY)
  }

  const syncAuthSessionFromStorage = () => {
    userId.value = String(getStore(USER_ID_KEY) || userId.value || '')
    customerToken.value = getStore(ACCESS_TOKEN_KEY) || ''
    customerRefreshToken.value = getStore(REFRESH_TOKEN_KEY) || ''
    customerTokenExpiresAt.value = getNumberStore(ACCESS_TOKEN_EXPIRES_AT_KEY)
    customerRefreshTokenExpiresAt.value = getNumberStore(REFRESH_TOKEN_EXPIRES_AT_KEY)

    if (!hasRefreshSession.value) {
      logout()
      return false
    }

    isLogin.value = true
    return true
  }

  /**
   * 记录用户信息并保存到本地存储
   */
  const recordUserInfo = (info) => {
    const payload = info.data || info
    const profile = payload.user || payload
    const accessToken = payload.accessToken || payload.token
    if (accessToken) {
      customerToken.value = accessToken
      setStore(ACCESS_TOKEN_KEY, accessToken)
    }
    if (payload.refreshToken) {
      customerRefreshToken.value = payload.refreshToken
      setStore(REFRESH_TOKEN_KEY, payload.refreshToken)
    }
    if (payload.expiresIn) {
      customerTokenExpiresAt.value = Date.now() + payload.expiresIn * 1000
      setStore(ACCESS_TOKEN_EXPIRES_AT_KEY, String(customerTokenExpiresAt.value))
    }
    if (payload.refreshExpiresIn) {
      customerRefreshTokenExpiresAt.value = Date.now() + payload.refreshExpiresIn * 1000
      setStore(REFRESH_TOKEN_EXPIRES_AT_KEY, String(customerRefreshTokenExpiresAt.value))
    }
    const normalizedUserId = profile.user_id == null ? String(profile.id || '') : String(profile.user_id)

    userInfo.value = {
      ...profile,
      user_id: normalizedUserId,
    }
    isLogin.value = true
    userId.value = normalizedUserId
    userName.value = profile.username || profile.nickname || profile.mobile || profile.phone || ''
    setStore(USER_ID_KEY, normalizedUserId)
    lastFetchTime.value = Date.now()
  }

  /**
   * 获取用户信息（带缓存机制）
   * @returns {Promise<object | null>} 用户信息对象或 null
   */
  const fetchUserInfo = async () => {
    const hasSession = syncAuthSessionFromStorage()

    // 如果已经在登录状态且有用户信息，直接返回
    if (isLogin.value && Object.keys(userInfo.value).length > 0) {
      return userInfo.value
    }

    if (!hasSession) {
      console.warn('用户未登录')
      return null
    }

    // 从 API 获取最新信息
    try {
      const info = await getUserInfoApi()
      recordUserInfo(info)
      return info
    }
    catch (error) {
      console.error('获取用户信息失败:', error)
      // API 失败（401/网络错误）→ 清除登录状态，让路由守卫正确拦截
      logout()
      return null
    }
  }

  /**
   * 更新用户名
   */
  const updateUserName = (name) => {
    userName.value = name
  }

  /**
   * 更新头像
   */
  const updateAvatar = (path) => {
    userInfo.value.avatar = path
  }

  syncAuthSessionFromStorage()

  return {
    userId,
    userInfo,
    userName,
    userAvatar,
    isLogin,
    customerToken,
    customerRefreshToken,
    customerTokenExpiresAt,
    customerRefreshTokenExpiresAt,
    isTokenFresh,
    hasRefreshSession,
    syncAuthSessionFromStorage,
    recordUserInfo,
    getUserInfo: fetchUserInfo,
    updateUserName,
    updateAvatar,
    logout,
  }
})

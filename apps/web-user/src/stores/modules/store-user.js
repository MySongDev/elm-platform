import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getUserInfo as getUserInfoApi } from '@/services/api'
import {
  clearAuthSession,
  persistAuthTokens,
  persistUserId,
  readAuthSession,
} from '@/services/http/auth-storage'

// 用户信息在同一会话内的缓存有效期，避免每次进入页面都重复拉取
const USER_INFO_TTL_MS = 5 * 60 * 1000

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref({})
  const userId = ref('')
  const userName = ref('')
  const lastFetchTime = ref(0)
  const customerToken = ref('')
  const customerRefreshToken = ref('')
  const customerTokenExpiresAt = ref(0)
  const customerRefreshTokenExpiresAt = ref(0)
  // 时间基准：computed 不会因真实时间流逝而失效，必须靠显式更新它来触发重算
  const now = ref(Date.now())

  // 计算属性
  const userAvatar = computed(() => userInfo.value.avatar || '')
  // 登录态的唯一判据：本地存在未过期的 refresh 会话
  const isLogin = computed(() =>
    Boolean(customerRefreshToken.value && customerRefreshTokenExpiresAt.value > now.value),
  )

  /** 将持久化快照应用为响应式状态，保证内存与本地存储同源 */
  const applySession = (session) => {
    userId.value = session.userId
    customerToken.value = session.accessToken
    customerRefreshToken.value = session.refreshToken
    customerTokenExpiresAt.value = session.accessTokenExpiresAt
    customerRefreshTokenExpiresAt.value = session.refreshTokenExpiresAt
  }

  // Actions
  const logout = () => {
    userInfo.value = {}
    userName.value = ''
    lastFetchTime.value = 0
    clearAuthSession()
    applySession(readAuthSession())
  }

  /**
   * 以本地存储为准同步登录态。
   * @returns {boolean} 是否存在可用的登录会话
   */
  const syncAuthSessionFromStorage = () => {
    now.value = Date.now()
    applySession(readAuthSession())

    if (!isLogin.value) {
      logout()
      return false
    }

    return true
  }

  /**
   * 记录登录响应中的令牌与用户资料
   */
  const recordUserInfo = (info) => {
    const payload = info.data || info
    const profile = payload.user || payload
    const normalizedUserId = profile.user_id == null ? String(profile.id || '') : String(profile.user_id)

    persistAuthTokens({
      accessToken: payload.accessToken || payload.token,
      refreshToken: payload.refreshToken,
      expiresIn: payload.expiresIn,
      refreshExpiresIn: payload.refreshExpiresIn,
    })
    persistUserId(normalizedUserId)

    // 回读持久化结果，避免内存状态与本地存储各自漂移
    now.value = Date.now()
    applySession(readAuthSession())

    userInfo.value = {
      ...profile,
      user_id: normalizedUserId,
    }
    userName.value = profile.username || profile.nickname || profile.mobile || profile.phone || ''
    lastFetchTime.value = Date.now()
  }

  /**
   * 获取用户信息（带会话内缓存）
   * @returns {Promise<object | null>} 用户信息对象或 null
   */
  const fetchUserInfo = async () => {
    if (!syncAuthSessionFromStorage()) {
      console.warn('用户未登录')
      return null
    }

    const isCacheFresh
      = Object.keys(userInfo.value).length > 0
        && Date.now() - lastFetchTime.value < USER_INFO_TTL_MS

    if (isCacheFresh) {
      return userInfo.value
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

  // 创建时对齐一次本地会话，过期会话在此立即清理
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
    syncAuthSessionFromStorage,
    recordUserInfo,
    getUserInfo: fetchUserInfo,
    updateUserName,
    updateAvatar,
    logout,
  }
})

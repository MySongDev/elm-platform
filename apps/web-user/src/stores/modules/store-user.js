import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getUserInfo as getUserInfoApi } from '@/services/api'
import { getStore, removeStore, setStore } from '@/untils/storage'

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref({})
  const isLogin = ref(false)
  const userId = ref('')
  const userName = ref('')
  const lastFetchTime = ref(0)

  // 计算属性
  const userAvatar = computed(() => userInfo.value.avatar || '')

  // Actions
  const logout = () => {
    userInfo.value = {}
    userId.value = ''
    userName.value = ''
    isLogin.value = false
    lastFetchTime.value = 0
    removeStore('user_id')
  }

  /**
   * 记录用户信息并保存到本地存储
   */
  const recordUserInfo = (info) => {
    const normalizedUserId = info.user_id == null ? '' : String(info.user_id)

    userInfo.value = {
      ...info,
      user_id: normalizedUserId,
    }
    isLogin.value = true
    userId.value = normalizedUserId
    userName.value = info.username || ''
    setStore('user_id', normalizedUserId)
    lastFetchTime.value = Date.now()
  }

  /**
   * 获取用户信息（带缓存机制）
   * @returns {Promise<object | null>} 用户信息对象或 null
   */
  const fetchUserInfo = async () => {
    // 如果已经在登录状态且有用户信息，直接返回
    if (isLogin.value && Object.keys(userInfo.value).length > 0) {
      return userInfo.value
    }

    // 尝试从本地存储获取 userId
    const storedUserId = String(getStore('user_id') || userId.value || '')

    if (!storedUserId) {
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

  // 初始化时自动获取用户信息
  fetchUserInfo().catch((error) => {
    console.error('初始化获取用户信息失败:', error)
  })

  return {
    userId,
    userInfo,
    userName,
    userAvatar,
    isLogin,
    recordUserInfo,
    getUserInfo: fetchUserInfo,
    updateUserName,
    updateAvatar,
    logout,
  }
})

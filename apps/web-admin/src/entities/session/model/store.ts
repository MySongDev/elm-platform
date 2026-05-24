/**
 * @file 认证会话状态
 * @domain entities/session
 * @description 管理登录 token、用户资料、后端菜单和动态路由加载状态，是权限系统的前端状态边界。
 */

import type { RouteRecordRaw } from 'vue-router'
import type { UpdateProfileParams, UserMenuNode } from './types'
import type { UserInfo } from '@/entities/user'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import request from '@/shared/api/request'
import { hasPermission as checkPermission } from '@/shared/lib/permission'
import { getUserMenus, updateProfile } from '../api'

interface LoginResult {
  token: string
  expiresIn?: number
  user: UserInfo
}

interface LoginCredentials {
  account: string
  password: string
  rememberMe?: boolean
}

const DEFAULT_SESSION_TTL_SECONDS = 24 * 60 * 60

/**
 * @description 有副作用：创建 Pinia 会话 store，store action 会读写持久化 token、调用认证接口并维护动态路由状态。
 * @returns 认证、用户资料、菜单和权限判断相关的响应式状态与操作。
 */
export const useAuthStore = defineStore('auth', () => {
  const token = shallowRef('')
  const tokenExpiresAt = shallowRef(0)
  const userInfo = ref<UserInfo | null>(null)
  const menus = ref<UserMenuNode[]>([])
  const menuRoutes = shallowRef<RouteRecordRaw[]>([])
  const routesLoaded = shallowRef(false)
  let loadingMenusPromise: Promise<UserMenuNode[]> | null = null

  const isLoggedIn = computed(() => {
    if (!token.value)
      return false
    return tokenExpiresAt.value > Date.now()
  })
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const permissions = computed(() => userInfo.value?.permissions ?? [])

  function hasPermission(required: string | string[]): boolean {
    return checkPermission(permissions.value, required)
  }

  function ensureSessionValid() {
    if (!token.value)
      return false

    if (!tokenExpiresAt.value || tokenExpiresAt.value <= Date.now()) {
      resetToken()
      return false
    }

    return true
  }

  async function login(credentials: LoginCredentials) {
    const res = await request.post<LoginResult>('/auth/login', credentials)
    token.value = res.token
    tokenExpiresAt.value = Date.now() + (res.expiresIn ?? DEFAULT_SESSION_TTL_SECONDS) * 1000
    userInfo.value = res.user
    resetRouteState()
    return res
  }

  async function getUserInfo() {
    if (!token.value)
      return
    try {
      userInfo.value = await request.get<UserInfo>('/auth/profile')
    }
    catch (error) {
      const isAuthError = error instanceof Error
        && ('response' in error || error.message.includes('401'))
      if (isAuthError)
        resetToken()
      else
        throw error
    }
  }

  async function updateUserInfo(data: UpdateProfileParams) {
    userInfo.value = await updateProfile(data)
    return userInfo.value
  }

  async function loadUserMenus(force = false) {
    if (routesLoaded.value && !force)
      return menus.value

    if (loadingMenusPromise && !force)
      return loadingMenusPromise

    loadingMenusPromise = (async () => {
      const menuTree = await getUserMenus()
      menus.value = menuTree
      return menuTree
    })()

    try {
      return await loadingMenusPromise
    }
    finally {
      loadingMenusPromise = null
    }
  }

  function setMenuRoutes(routes: RouteRecordRaw[]) {
    menuRoutes.value = routes
    routesLoaded.value = true
  }

  function resetRouteState() {
    menus.value = []
    menuRoutes.value = []
    routesLoaded.value = false
    loadingMenusPromise = null
  }

  function logout() {
    token.value = ''
    tokenExpiresAt.value = 0
    userInfo.value = null
    resetRouteState()
  }

  function resetToken() {
    token.value = ''
    tokenExpiresAt.value = 0
    userInfo.value = null
    resetRouteState()
  }

  return {
    token,
    tokenExpiresAt,
    userInfo,
    menus,
    menuRoutes,
    routesLoaded,
    isLoggedIn,
    isAdmin,
    permissions,
    hasPermission,
    ensureSessionValid,
    login,
    getUserInfo,
    loadUserMenus,
    setMenuRoutes,
    resetRouteState,
    updateUserInfo,
    logout,
    resetToken,
  }
}, {
  persist: {
    key: 'elm-admin-auth',
    storage: localStorage,
    pick: ['token', 'tokenExpiresAt'],
  },
})

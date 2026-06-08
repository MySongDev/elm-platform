/**
 * @file 认证路由守卫
 * @domain app/router
 * @description 有副作用：根据登录态拦截受保护页面、重定向登录页并清理动态路由状态。
 */

import type { Router } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@/shared/config/paths'
import { resetDynamicRoutes } from '../dynamic-routes'

export function setupAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore()
    authStore.ensureSessionValid()

    if (!authStore.isLoggedIn) {
      resetDynamicRoutes()
      authStore.resetRouteState()
      if (to.meta.requiresAuth !== false) {
        return {
          path: LOGIN_PATH,
          query: { redirect: to.fullPath },
        }
      }
      return true
    }

    if (to.path === LOGIN_PATH) {
      return { path: DEFAULT_HOME_PATH }
    }

    return true
  })
}

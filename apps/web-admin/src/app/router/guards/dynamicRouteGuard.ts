/**
 * @file 动态路由守卫
 * @domain app/router
 * @description 有副作用：页面刷新后加载用户信息和后端菜单，构建并注册动态路由。
 */

import type { Router } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { LOGIN_PATH, SERVER_ERROR_PATH } from '@/shared/config/paths'
import { buildRoutes } from '../build-routes'
import { registerDynamicRoutes, resetDynamicRoutes } from '../dynamic-routes'

export function setupDynamicRouteGuard(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    if (!authStore.isLoggedIn)
      return true

    if (to.meta.requiresAuth === false)
      return true

    try {
      if (!authStore.userInfo)
        await authStore.getUserInfo()

      if (!authStore.isLoggedIn) {
        return {
          path: LOGIN_PATH,
          query: { redirect: to.fullPath },
        }
      }

      if (!authStore.routesLoaded) {
        const menus = await authStore.loadUserMenus()
        const routes = buildRoutes(menus)
        authStore.setMenuRoutes(routes)
        registerDynamicRoutes(router, routes)
        return {
          path: to.fullPath,
          replace: true,
        }
      }
    }
    catch {
      if (!authStore.isLoggedIn) {
        resetDynamicRoutes()
        return {
          path: LOGIN_PATH,
          query: { redirect: to.fullPath },
        }
      }
      if (authStore.routesLoaded)
        return true
      return {
        path: SERVER_ERROR_PATH,
        query: { redirect: to.fullPath },
        replace: true,
      }
    }

    return true
  })
}

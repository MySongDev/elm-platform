/**
 * @file 权限路由守卫
 * @domain app/router
 * @description 有副作用：基于路由 meta.roles/meta.auths 校验访问权限，无权限时重定向到 403。
 */

import type { Router } from 'vue-router'
import { useAuthStore } from '@/entities/session'
import { FORBIDDEN_PATH } from '@/shared/config/paths'
import { canAccessRoute } from '@/shared/lib/permission'

export function setupPermissionGuard(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore()

    if (!authStore.isLoggedIn || !authStore.routesLoaded)
      return true

    if (!canAccessRoute(to, {
      role: authStore.userInfo?.role,
      permissions: authStore.permissions,
    })) {
      return { path: FORBIDDEN_PATH }
    }

    return true
  })
}

/**
 * ⚠️ 与 apps/web-user/src/composables/app/useAuthRedirect.ts 同源改造。
 * web-user 版依赖 vue-router（useRoute/useRouter），整体作废 → 本文件用
 * platform/navigation 重写，**对外 API 形状保持一致**（isAuthenticated /
 * redirectToLogin / requireAuth），调用方（search 等）迁移时不用改用法。
 *
 * 差异：
 * - `route.fullPath` → getCurrentFullPath()（页面栈栈顶 + options）
 * - `router.push({ path, query })` → redirectToLogin(redirect)（内部拼 withQuery）
 */
import { computed } from 'vue'

import { getCurrentFullPath, redirectToLogin } from '@/platform/navigation'
import { useUserStore } from '@/stores/modules/store-user'

export function useAuthRedirect() {
  const userStore = useUserStore()

  const isAuthenticated = computed(() => userStore.isLogin)

  function doRedirectToLogin(redirect?: string) {
    redirectToLogin(redirect ?? getCurrentFullPath())
  }

  function requireAuth(action?: () => void, redirect?: string): boolean {
    if (!userStore.syncAuthSessionFromStorage()) {
      doRedirectToLogin(redirect)
      return false
    }

    action?.()
    return true
  }

  return {
    isAuthenticated,
    redirectToLogin: doRedirectToLogin,
    requireAuth,
  }
}

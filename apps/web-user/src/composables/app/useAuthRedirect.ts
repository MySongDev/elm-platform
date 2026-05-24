import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useUserStore } from '@/stores/modules/store-user'

export function useAuthRedirect() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()

  const isAuthenticated = computed(() =>
    Boolean(userStore.hasRefreshSession && userStore.isLogin),
  )

  function redirectToLogin(redirect?: string) {
    router.push({
      path: '/login',
      query: { redirect: redirect ?? route.fullPath },
    })
  }

  function requireAuth(action?: () => void, redirect?: string): boolean {
    if (!userStore.syncAuthSessionFromStorage()) {
      redirectToLogin(redirect)
      return false
    }

    action?.()
    return true
  }

  return {
    isAuthenticated,
    redirectToLogin,
    requireAuth,
  }
}

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useUserStore } from '@/stores/modules/store-user'

export function useAuthRedirect() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()

  const isAuthenticated = computed(() =>
    Boolean(userStore.isLogin || userStore.userId || (userStore.userInfo as any)?.user_id),
  )

  function redirectToLogin(redirect?: string) {
    router.push({
      path: '/login',
      query: { redirect: redirect ?? route.fullPath },
    })
  }

  function requireAuth(action?: () => void, redirect?: string): boolean {
    if (!isAuthenticated.value) {
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

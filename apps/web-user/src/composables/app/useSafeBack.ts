import { useRouter } from 'vue-router'

interface SafeBackOptions {
  fallback?: string
  fallbackName?: string
  delta?: number
}

export function useSafeBack() {
  const router = useRouter()

  function goBack(options: SafeBackOptions = {}) {
    const {
      fallback = '/',
      fallbackName = 'Home',
      delta = 1,
    } = options

    const historyStack: string[] = JSON.parse(sessionStorage.getItem('router_history') || '[]')

    if (historyStack.length >= delta) {
      router.back()
      historyStack.splice(-delta)
      sessionStorage.setItem('router_history', JSON.stringify(historyStack))
      return
    }

    router.replace({ name: fallbackName }).catch(() => {
      router.replace(fallback)
    })
  }

  return { goBack }
}

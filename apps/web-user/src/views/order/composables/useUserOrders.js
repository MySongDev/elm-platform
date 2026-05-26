import { readonly, ref, shallowRef, toValue, watch } from 'vue'

import { getUserPaymentOrders } from '@/services/api/api-payment'

export function useUserOrders(userIdSource, options = {}) {
  const orders = ref([])
  const loading = shallowRef(false)
  const error = shallowRef('')
  const hasLoaded = shallowRef(false)
  let requestSeq = 0

  async function fetchOrders() {
    const userId = String(toValue(userIdSource) || '')
    const currentRequest = ++requestSeq

    if (!userId) {
      orders.value = []
      loading.value = false
      hasLoaded.value = true
      return
    }

    loading.value = true
    error.value = ''

    try {
      const result = await getUserPaymentOrders(options.limit || 20)
      if (currentRequest !== requestSeq)
        return

      orders.value = Array.isArray(result?.orders) ? result.orders : []
    }
    catch (err) {
      if (currentRequest !== requestSeq)
        return

      error.value = err?.message || '订单加载失败，请稍后重试'
      orders.value = []
    }
    finally {
      if (currentRequest === requestSeq) {
        loading.value = false
        hasLoaded.value = true
      }
    }
  }

  watch(
    () => toValue(userIdSource),
    () => {
      fetchOrders()
    },
    { immediate: true },
  )

  return {
    orders: readonly(orders),
    loading: readonly(loading),
    error: readonly(error),
    hasLoaded: readonly(hasLoaded),
    fetchOrders,
  }
}

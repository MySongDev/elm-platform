// ⚠️ 与 apps/web-user/src/views/order/composables/useUserOrders.js 同源（逐行一致），
// 修改需同步两处。不抽共享包的原因见迁移方案议题 7。
// 纯逻辑：fetch 订单列表 + 竞态保护（requestSeq），依赖 api-payment 的 getUserPaymentOrders，
// 端无关（uni-user 侧 TransportError 已在 api 层收口），无需平台分支。
import { readonly, ref, shallowRef, toValue, watch } from 'vue'

import { getUserPaymentOrders } from '@/services/api/api-payment'

export function useUserOrders(isLoggedIn, options = {}) {
  const orders = ref([])
  const loading = shallowRef(false)
  const error = shallowRef('')
  const hasLoaded = shallowRef(false)
  let requestSeq = 0

  async function fetchOrders() {
    const currentRequest = ++requestSeq

    // 未登录不发请求：订单归属完全由请求头中的令牌决定，页面无需也不应传入身份
    if (!toValue(isLoggedIn)) {
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
    () => toValue(isLoggedIn),
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

// shop 页数据加载（商家详情 + 菜单）+ 支付成功回跳后清空本店购物车。
//
// ⚠️ 与 web-user useShopPageData.js 的差异：
// 1. consumePaidOrder 改为**暴露给页面在 onShow 调用**，不在 loadShopData 里调：
//    小程序从支付链路 navigateBack 回到本页时 onLoad 不重跑、shopId 不变 →
//    挂在 watch(shopId) 上的检查永远不会再触发。onShow 是「每次回到页面」的唯一时机。
// 2. 新增 loadError：web-user 加载失败只有 finally 里的 pageLoading=false，
//    页面静默空白；这里暴露错误态给 BaseState 的 retry 用。
import { ref, watch } from 'vue'

import { getFoodMenu, getShopDetails } from '@/services/api/api-shop'
import { clearPaymentSuccessContext, getPaymentSuccessContext } from '@/utils/payment'

export function useShopPageData(shopId, options = {}) {
  const { onPaidOrderConsumed } = options

  const shopData = ref(null)
  const foodMenuData = ref([])
  const activeCategoryId = ref(null)
  const pageLoading = ref(false)
  const loadError = ref(false)

  /**
   * 本店的订单已支付成功 → 清空本店购物车并消费掉成功上下文。
   *
   * 上下文由 PaymentResult.vue 在查到 PAID 时写入（shopId 取后端订单的真实商家 id）。
   * ⚠️ 不能指望 PaymentResult 里的 cartStore.consumePaidCheckout 兜底：它只认
   * cart 页合并结算的固定 id `cart-checkout`，对 shop 页直接结算是 no-op。
   */
  function consumePaidOrder() {
    const successContext = getPaymentSuccessContext()

    if (!successContext?.shopId || !shopId.value) {
      return
    }

    if (String(successContext.shopId) !== String(shopId.value)) {
      return
    }

    onPaidOrderConsumed?.()
    clearPaymentSuccessContext()
  }

  async function loadShopData() {
    if (!shopId.value) {
      return
    }

    pageLoading.value = true
    loadError.value = false
    try {
      const [shopRes, menuRes] = await Promise.all([
        getShopDetails(shopId.value),
        getFoodMenu(shopId.value),
      ])

      shopData.value = shopRes
      foodMenuData.value = Array.isArray(menuRes) ? menuRes : []

      const selected = foodMenuData.value.find(item => item.is_selected)
      activeCategoryId.value = selected?.id ?? foodMenuData.value[0]?.id ?? null
    }
    catch {
      loadError.value = true
    }
    finally {
      pageLoading.value = false
    }
  }

  watch(shopId, loadShopData, { immediate: true })

  return {
    shopData,
    foodMenuData,
    activeCategoryId,
    pageLoading,
    loadError,
    loadShopData,
    consumePaidOrder,
  }
}

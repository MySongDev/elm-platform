// shop 页数据加载（商家详情 + 菜单）+ 支付成功回跳后清空本店购物车。
//
// ⚠️ 与 web-user useShopPageData.js 的差异：
// 1. consumePaidOrder 改为**暴露给页面在 onShow 调用**，不在 loadShopData 里调：
//    小程序从支付链路 navigateBack 回到本页时 onLoad 不重跑、shopId 不变 →
//    挂在 watch(shopId) 上的检查永远不会再触发。onShow 是「每次回到页面」的唯一时机。
// 2. 两端均暴露 loadError；本端交给 BaseState 的 retry，H5 使用页面内重试入口。
import { onScopeDispose, ref, watch } from 'vue'

import { getMenuCategories, getShopDetails } from '@/services/api/api-shop'
import { clearPaymentSuccessContext, getPaymentSuccessContext } from '@/utils/payment'
import { useCategoryFoods } from './useCategoryFoods'

export function useShopPageData(shopId, options = {}) {
  const { onPaidOrderConsumed } = options

  const shopData = ref(null)
  const { foodMenuData, activeCategoryId, resetMenu, loadCategoryFoods } = useCategoryFoods(shopId)
  const pageLoading = ref(false)
  const loadError = ref(false)
  let loadRevision = 0
  onScopeDispose(() => { loadRevision += 1 })

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
    const revision = ++loadRevision
    const restaurantId = shopId.value
    shopData.value = null
    resetMenu()
    if (!restaurantId) {
      pageLoading.value = false
      return
    }

    pageLoading.value = true
    loadError.value = false
    try {
      const [shopRes, menuRes] = await Promise.all([
        getShopDetails(restaurantId),
        getMenuCategories(restaurantId),
      ])
      if (revision !== loadRevision) {
        return
      }
      resetMenu(Array.isArray(menuRes) ? menuRes : [])
      // 先加载首分类，再挂载连续商品流，避免占位块短暂全落入可视区而同时发出大量请求。
      await loadCategoryFoods(activeCategoryId.value)
      if (revision !== loadRevision) {
        return
      }
      shopData.value = shopRes
    }
    catch {
      if (revision === loadRevision) {
        loadError.value = true
      }
    }
    finally {
      if (revision === loadRevision) {
        pageLoading.value = false
      }
    }
  }

  watch(shopId, loadShopData, { immediate: true })

  return {
    shopData,
    foodMenuData,
    activeCategoryId,
    pageLoading,
    loadError,
    loadCategoryFoods,
    loadShopData,
    consumePaidOrder,
  }
}

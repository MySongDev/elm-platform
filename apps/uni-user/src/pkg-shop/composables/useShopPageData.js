// shop 页数据加载（商家详情 + 菜单）+ 支付成功回跳后清空本店购物车。
//
// ⚠️ 与 web-user useShopPageData.js 的差异：
// 1. consumePaidOrder 改为**暴露给页面在 onShow 调用**，不在 loadShopData 里调：
//    小程序从支付链路 navigateBack 回到本页时 onLoad 不重跑、shopId 不变 →
//    挂在 watch(shopId) 上的检查永远不会再触发。onShow 是「每次回到页面」的唯一时机。
// 2. 两端均暴露 loadError；本端交给 BaseState 的 retry，H5 使用页面内重试入口。
import { onScopeDispose, ref, watch } from 'vue'

import { getMenuCategories, getShopDetails } from '@/services/api/api-shop'
import { useCartStore } from '@/stores/modules/store-cart'
import { useUserStore } from '@/stores/modules/store-user'
import { clearPaymentSuccessContext, getPaymentSuccessContext } from '@/utils/payment'
import { useCategoryFoods } from './useCategoryFoods'

export function useShopPageData(shopId, options = {}) {
  const { onPaidOrderConsumed } = options
  const cartStore = useCartStore()
  const userStore = useUserStore()

  const shopData = ref(null)
  const { foodMenuData, activeCategoryId, resetMenu, loadCategoryFoods } = useCategoryFoods(shopId)
  const pageLoading = ref(false)
  const loadError = ref(false)
  let loadRevision = 0
  onScopeDispose(() => { loadRevision += 1 })

  /**
   * 本店的订单已支付成功 → 只扣掉这张订单买过的数量，并消费掉成功上下文。
   *
   * 上下文由 PaymentResult.vue 在查到 PAID 时写入（shopId 取后端订单的真实商家 id）。
   * ⚠️ 不再整店清空：付款期间用户可能又往这家店加了商品，
   * 整店清空会把没付钱的那部分一起删掉。
   * 精确扣减走 cart store 的 consumePaidSnapshot，它内部记消费标记，重复调用不会二次扣。
   */
  function consumePaidOrder() {
    const successContext = getPaymentSuccessContext()

    if (!successContext?.shopId || !shopId.value) {
      return
    }

    if (String(successContext.shopId) !== String(shopId.value)) {
      return
    }

    // consumePaidSnapshot 要求 status 是 PAID、userId 与快照一致，这里据实传入后端摘要。
    const consumed = cartStore.consumePaidSnapshot(userStore.userId, {
      orderNo: successContext.orderNo,
      shopId: successContext.shopId,
      status: 'PAID',
    })

    // 没有对应快照（老订单/直接结算未登记）时才回退到旧清车回调，
    // 保证既有流程不会因为快照缺失而永远清不掉车。
    if (!consumed)
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

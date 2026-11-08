import { onScopeDispose, ref, watch } from 'vue'
import { getMenuCategories, getShopDetails } from '@/services/api/api-shop'
import { clearPaymentSuccessContext, getPaymentSuccessContext } from '@/utils/payment'
import { useCategoryFoods } from './useCategoryFoods'

export function useShopPageData(options) {
  const { shopId, onPaidOrderConsumed } = options

  const shopData = ref(null)
  const { foodMenuData, activeCategoryId, resetMenu, loadCategoryFoods } = useCategoryFoods(shopId)
  const pageLoading = ref(true)
  const loadError = ref(false)
  let loadRevision = 0
  onScopeDispose(() => { loadRevision += 1 })

  function consumePaidOrder() {
    const successContext = getPaymentSuccessContext()

    if (!successContext?.shopId)
      return

    if (String(successContext.shopId) !== String(shopId.value))
      return

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
      consumePaidOrder()
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
  }
}

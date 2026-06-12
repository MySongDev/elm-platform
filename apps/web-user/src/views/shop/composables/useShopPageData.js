import { ref, watch } from 'vue'
import { getFoodMenu, getShopDetails } from '@/services/api/api-shop'
import { clearPaymentSuccessContext, getPaymentSuccessContext } from '@/utils/payment'

export function useShopPageData(options) {
  const { shopId, onPaidOrderConsumed } = options

  const shopData = ref(null)
  const foodMenuData = ref([])
  const activeCategoryId = ref(null)
  const pageLoading = ref(true)

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
    if (!shopId.value)
      return

    pageLoading.value = true
    try {
      const [shopRes, menuRes] = await Promise.all([
        getShopDetails(shopId.value),
        getFoodMenu(shopId.value),
      ])

      shopData.value = shopRes
      foodMenuData.value = Array.isArray(menuRes) ? menuRes : []

      const selected = foodMenuData.value.find(item => item.is_selected)
      activeCategoryId.value = selected?.id ?? foodMenuData.value[0]?.id ?? null

      consumePaidOrder()
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
    loadShopData,
  }
}

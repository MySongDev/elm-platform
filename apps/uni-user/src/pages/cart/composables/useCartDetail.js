// ⚠️ 与 apps/web-user/src/views/cart/composables/useCartDetail.js 同源（逐行一致）。
// 纯 store 包装（storeToRefs + 方法透出），零端依赖，直接搬。

import { storeToRefs } from 'pinia'

import { useCartStore } from '@/stores/modules/store-cart'

export function useCartDetail() {
  const cartStore = useCartStore()
  const {
    stores,
    hasItems,
    selectedCount,
    selectedQuantity,
    selectedTotal,
    totalCount,
    allSelected,
    checkoutItems,
    selectedProducts,
  } = storeToRefs(cartStore)

  const {
    isStoreSelected,
    toggleAll,
    toggleStore,
    toggleProduct,
    increaseQuantity,
    decreaseQuantity,
    removeSelected,
    markPendingCheckout,
  } = cartStore

  return {
    stores,
    hasItems,
    selectedCount,
    selectedQuantity,
    selectedTotal,
    totalCount,
    allSelected,
    checkoutItems,
    selectedProducts,
    isStoreSelected,
    toggleAll,
    toggleStore,
    toggleProduct,
    increaseQuantity,
    decreaseQuantity,
    removeSelected,
    markPendingCheckout,
  }
}

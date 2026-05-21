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

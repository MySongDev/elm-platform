import { useCartStore } from '@/stores/modules/store-cart'
import { createCheckoutRequestId } from '@/utils/checkout-entry'
import { areCheckoutItemsEqual } from '@/utils/checkout-snapshot'

/** 两个结算入口共用请求 ID；建单响应丢失时必须复用同一键，不能再建一张单。 */
export function useCheckoutEntry() {
  const cartStore = useCartStore()

  function beginCheckout(input) {
    const { userId, shopId, cartItems } = input
    const pending = cartStore.getPendingCheckout(userId, shopId)
    const requestId = pending && areCheckoutItemsEqual(pending.cartItems, cartItems)
      ? pending.requestId
      : createCheckoutRequestId()

    cartStore.registerCheckout(userId, requestId, shopId, cartItems)
    return requestId
  }

  function bindOrder(userId, requestId, orderNo) {
    cartStore.bindCheckoutOrder(userId, requestId, orderNo)
  }

  return {
    beginCheckout,
    bindOrder,
  }
}

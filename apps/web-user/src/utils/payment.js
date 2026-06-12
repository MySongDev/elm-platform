import { getStore, removeStore, setStore } from './storage/storage'

export const PAYMENT_CHECKOUT_DRAFT_KEY = 'payment_checkout_draft'
export const PAYMENT_SUCCESS_CONTEXT_KEY = 'payment_success_context'

export function savePaymentCheckoutDraft(payload) {
  setStore(PAYMENT_CHECKOUT_DRAFT_KEY, payload)
}

export function getPaymentCheckoutDraft() {
  return getStore(PAYMENT_CHECKOUT_DRAFT_KEY)
}

export function clearPaymentCheckoutDraft() {
  removeStore(PAYMENT_CHECKOUT_DRAFT_KEY)
}

export function savePaymentSuccessContext(payload) {
  setStore(PAYMENT_SUCCESS_CONTEXT_KEY, payload)
}

export function getPaymentSuccessContext() {
  return getStore(PAYMENT_SUCCESS_CONTEXT_KEY)
}

export function clearPaymentSuccessContext() {
  removeStore(PAYMENT_SUCCESS_CONTEXT_KEY)
}

export function buildPaymentCartItems(cartItems = []) {
  return cartItems
    .map(item => ({
      itemId: item.food?.item_id,
      skuId: item.food?.specfoods?.[item.specIndex]?.sku_id || item.food?.item_id,
      title: item.food?.name || '商品',
      qty: item.qty,
      unitPrice: Number(item.food?.specfoods?.[item.specIndex]?.price || 0),
    }))
    .filter(item => item.itemId && item.qty > 0 && item.unitPrice > 0)
}

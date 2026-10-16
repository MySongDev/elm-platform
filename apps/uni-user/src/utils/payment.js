// ⚠️ 与 apps/web-user/src/utils/payment.js 同源（逐行一致），修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7。
// 纯 storage 封装（key 常量 + 读写），零端依赖；storage 入口在 uni-user 侧已是 platform/storage。

import { getStore, removeStore, setStore } from './storage'

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

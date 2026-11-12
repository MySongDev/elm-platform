// 结算快照的统一入口：两个结算页（cart / shop）都走这里，避免各写一套 requestId 与登记逻辑。
//
// 为什么必须在上报前就登记并落盘：
// 建单请求发出后如果超时、断网或用户杀掉小程序，前端拿不到 orderNo，但后端可能已经建了单。
// 用户重试时只有带着**同一个 requestId**，后端才能认出这是同一笔结算并回原单；
// 换成新 ID 就会真的多建一张订单。
import { useCartStore } from '@/stores/modules/store-cart'
import { createCheckoutRequestId } from '@/utils/checkout-entry'

/**
 * 取本次结算该用的 requestId 并登记快照。
 *
 * 同一份选择已经有未消费快照时沿用它（响应丢失后的重试）；
 * 商品选择变了就生成新 ID 并登记新快照——旧快照留着，用于确认旧订单是否已付款。
 */
export function useCheckoutEntry() {
  const cartStore = useCartStore()

  function beginCheckout(input) {
    const { userId, shopId, cartItems } = input
    const pending = cartStore.getPendingCheckout(userId, shopId)
    const requestId = pending && isSameSelection(pending.cartItems, cartItems)
      ? pending.requestId
      : createCheckoutRequestId()

    cartStore.registerCheckout(userId, requestId, shopId, cartItems)
    return requestId
  }

  /** 建单响应回来（或沿原单恢复）后把 orderNo 绑到快照。 */
  function bindOrder(userId, requestId, orderNo) {
    cartStore.bindCheckoutOrder(userId, requestId, orderNo)
  }

  return {
    beginCheckout,
    bindOrder,
  }
}

/** 只比商品身份与数量，不比价格：菜单改价后重试仍应视为同一份选择。 */
function isSameSelection(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length)
    return false

  return left.every((item, index) => {
    const other = right[index]
    return String(item.itemId) === String(other.itemId)
      && String(item.skuId) === String(other.skuId)
      && Number(item.qty) === Number(other.qty)
  })
}

import { toPrice } from './order-draft.factory'
import { getAdminAvailableActions, getCustomerAvailableActions, normalizeFulfillmentStatus, normalizeRefundStatus } from './order-transition.policy'

type PaymentOrderRecord = Record<string, any>

/**
 * 统一列表、详情、支付结果和状态变更的订单摘要。
 * 金额转换、旧记录的状态补全和可用操作来自同一实现，避免各端响应逐渐漂移。
 */
export function toOrderSummary(order: PaymentOrderRecord) {
  const cartItems = Array.isArray(order.cartItems) ? order.cartItems : []
  const fulfillmentStatus = normalizeFulfillmentStatus(order)
  const refundStatus = normalizeRefundStatus(order)

  return {
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    shopId: order.shopId,
    shopName: order.shopName,
    status: order.status,
    tradeStatus: order.tradeStatus,
    fulfillmentStatus,
    refundStatus,
    refundBaseFulfillmentStatus: order.refundBaseFulfillmentStatus || null,
    refundReason: order.refundReason || null,
    refundRejectReason: order.refundRejectReason || null,
    payableAmount: toPrice(order.payableAmount),
    goodsAmount: toPrice(order.goodsAmount),
    deliveryFee: toPrice(order.deliveryFee),
    cartItems,
    totalQty: cartItems.reduce((sum: number, item: Record<string, any>) => sum + Number(item.qty || 0), 0),
    paidAt: order.paidAt || null,
    acceptedAt: order.acceptedAt || null,
    preparingAt: order.preparingAt || null,
    deliveringAt: order.deliveringAt || null,
    completedAt: order.completedAt || null,
    canceledAt: order.canceledAt || null,
    refundRequestedAt: order.refundRequestedAt || null,
    refundedAt: order.refundedAt || null,
    refundRejectedAt: order.refundRejectedAt || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    tradeNo: order.tradeNo || null,
    availableActions: getAdminAvailableActions({
      ...order,
      fulfillmentStatus,
      refundStatus,
    }),
    customerAvailableActions: getCustomerAvailableActions({
      ...order,
      fulfillmentStatus,
      refundStatus,
    }),
  }
}

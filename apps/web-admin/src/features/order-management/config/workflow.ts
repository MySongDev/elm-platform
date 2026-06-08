import type { AdminOrderAction, FulfillmentStatus, OrderItem, PaymentOrderStatus, RefundStatus } from '@/entities/order'
import type { ActionConfig } from '@/shared/workflow'
import { Permissions } from '@/shared/config/access'

export const paymentStatusLabelMap: Record<string, string> = {
  PENDING: 'commerce.order.paymentPending',
  PAID: 'commerce.order.paymentPaid',
  CLOSED: 'commerce.order.paymentClosed',
}

export const fulfillmentStatusLabelMap: Record<FulfillmentStatus, string> = {
  PENDING_PAYMENT: 'commerce.order.fulfillmentPendingPayment',
  AWAITING_ACCEPTANCE: 'commerce.order.fulfillmentAwaitingAcceptance',
  ACCEPTED: 'commerce.order.fulfillmentAccepted',
  PREPARING: 'commerce.order.fulfillmentPreparing',
  DELIVERING: 'commerce.order.fulfillmentDelivering',
  COMPLETED: 'commerce.order.fulfillmentCompleted',
  CANCELED: 'commerce.order.fulfillmentCanceled',
}

export const refundStatusLabelMap: Record<RefundStatus, string> = {
  NONE: 'commerce.order.refundNone',
  REQUESTED: 'commerce.order.refundRequested',
  APPROVED: 'commerce.order.refundApproved',
  REJECTED: 'commerce.order.refundRejected',
}

export const orderActionConfig: Record<AdminOrderAction, ActionConfig> = {
  ACCEPT: {
    label: 'commerce.order.actionAccept',
    permission: Permissions.COMMERCE_ORDER_ACCEPT,
    confirmText: 'commerce.order.confirmAccept',
  },
  START_PREPARING: {
    label: 'commerce.order.actionPrepare',
    permission: Permissions.COMMERCE_ORDER_PREPARE,
    confirmText: 'commerce.order.confirmPrepare',
  },
  START_DELIVERY: {
    label: 'commerce.order.actionDeliver',
    permission: Permissions.COMMERCE_ORDER_DELIVER,
    confirmText: 'commerce.order.confirmDeliver',
  },
  COMPLETE: {
    label: 'commerce.order.actionComplete',
    permission: Permissions.COMMERCE_ORDER_COMPLETE,
    confirmText: 'commerce.order.confirmComplete',
  },
  APPROVE_REFUND: {
    label: 'commerce.order.actionApproveRefund',
    permission: Permissions.COMMERCE_ORDER_REFUND_APPROVE,
    confirmText: 'commerce.order.confirmApproveRefund',
    danger: true,
  },
  REJECT_REFUND: {
    label: 'commerce.order.actionRejectRefund',
    permission: Permissions.COMMERCE_ORDER_REFUND_REJECT,
    confirmText: 'commerce.order.confirmRejectRefund',
    danger: true,
  },
}

export function getPaymentStatusType(status: PaymentOrderStatus | string) {
  if (status === 'PAID')
    return 'success'
  if (status === 'PENDING')
    return 'warning'
  return 'info'
}

export function getFulfillmentStatusType(status: FulfillmentStatus) {
  if (status === 'COMPLETED')
    return 'success'
  if (status === 'CANCELED')
    return 'info'
  if (status === 'PREPARING' || status === 'DELIVERING')
    return 'primary'
  return 'warning'
}

export function getRefundStatusType(status: RefundStatus) {
  if (status === 'APPROVED')
    return 'success'
  if (status === 'REQUESTED')
    return 'danger'
  if (status === 'REJECTED')
    return 'warning'
  return 'info'
}

/**
 * @deprecated 使用 StateMachineActions 组件替代，此函数保留用于兼容
 */
export function getVisibleOrderActions(order: OrderItem, hasPermission: (permission: string) => boolean) {
  return (order.availableActions || [])
    .map(action => ({
      action,
      ...orderActionConfig[action],
      labelKey: orderActionConfig[action].label,
    }))
    .filter(item => Boolean(item.permission) && hasPermission(item.permission!))
}

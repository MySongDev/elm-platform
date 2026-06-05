import type {
  AdminOrderAction,
  CustomerOrderAction,
  FulfillmentStatus,
  OrderWorkflowSnapshot,
  RefundStatus,
} from './order.types'
import { ConflictException } from '@nestjs/common'

const fulfillmentTransitionMap: Partial<Record<AdminOrderAction, Partial<Record<FulfillmentStatus, FulfillmentStatus>>>> = {
  ACCEPT: {
    AWAITING_ACCEPTANCE: 'ACCEPTED',
  },
  START_PREPARING: {
    ACCEPTED: 'PREPARING',
  },
  START_DELIVERY: {
    PREPARING: 'DELIVERING',
  },
  COMPLETE: {
    DELIVERING: 'COMPLETED',
  },
}

const refundableFulfillmentStatuses: FulfillmentStatus[] = [
  'AWAITING_ACCEPTANCE',
  'ACCEPTED',
  'PREPARING',
]

export function normalizeFulfillmentStatus(order: OrderWorkflowSnapshot): FulfillmentStatus {
  if (order.fulfillmentStatus)
    return order.fulfillmentStatus as FulfillmentStatus

  if (order.status === 'PAID')
    return 'AWAITING_ACCEPTANCE'

  if (order.status === 'CLOSED')
    return 'CANCELED'

  return 'PENDING_PAYMENT'
}

export function normalizeRefundStatus(order: OrderWorkflowSnapshot): RefundStatus {
  return (order.refundStatus || 'NONE') as RefundStatus
}

export function canUseFulfillmentActions(order: OrderWorkflowSnapshot) {
  return order.status === 'PAID'
}

export function getNextFulfillmentStatus(order: OrderWorkflowSnapshot, action: AdminOrderAction): FulfillmentStatus {
  const current = normalizeFulfillmentStatus(order)
  const next = fulfillmentTransitionMap[action]?.[current]

  if (!next)
    throw new ConflictException('当前订单状态不允许该操作')

  return next
}

export function getAdminAvailableActions(order: OrderWorkflowSnapshot): AdminOrderAction[] {
  if (!canUseFulfillmentActions(order))
    return []

  const current = normalizeFulfillmentStatus(order)
  const refundStatus = normalizeRefundStatus(order)
  const actions = Object.entries(fulfillmentTransitionMap)
    .filter(([, transitions]) => Boolean(transitions?.[current]))
    .map(([action]) => action as AdminOrderAction)

  if (refundStatus === 'REQUESTED') {
    actions.push('APPROVE_REFUND', 'REJECT_REFUND')
  }

  return actions
}

export function getCustomerAvailableActions(order: OrderWorkflowSnapshot): CustomerOrderAction[] {
  return canRequestRefund(order) ? ['REQUEST_REFUND'] : []
}

export function canRequestRefund(order: OrderWorkflowSnapshot) {
  return order.status === 'PAID'
    && normalizeRefundStatus(order) === 'NONE'
    && refundableFulfillmentStatuses.includes(normalizeFulfillmentStatus(order))
}

export function assertAdminActionAllowed(order: OrderWorkflowSnapshot, action: AdminOrderAction) {
  if (!canUseFulfillmentActions(order)) {
    throw new ConflictException('未支付或已关闭订单不能执行履约操作')
  }

  if (action === 'APPROVE_REFUND' || action === 'REJECT_REFUND') {
    assertRefundReviewAllowed(order)
    return
  }

  getNextFulfillmentStatus(order, action)
}

export function assertRefundRequestAllowed(order: OrderWorkflowSnapshot) {
  if (!canRequestRefund(order)) {
    throw new ConflictException('当前订单状态不允许申请退款')
  }
}

export function assertRefundReviewAllowed(order: OrderWorkflowSnapshot) {
  if (normalizeRefundStatus(order) !== 'REQUESTED') {
    throw new ConflictException('当前退款状态不允许审批')
  }
}

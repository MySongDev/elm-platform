export const paymentStatuses = ['PENDING', 'PAID', 'CLOSED'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export const fulfillmentStatuses = [
  'PENDING_PAYMENT',
  'AWAITING_ACCEPTANCE',
  'ACCEPTED',
  'PREPARING',
  'DELIVERING',
  'COMPLETED',
  'CANCELED',
] as const
export type FulfillmentStatus = (typeof fulfillmentStatuses)[number]

export const refundStatuses = ['NONE', 'REQUESTED', 'APPROVED', 'REJECTED'] as const
export type RefundStatus = (typeof refundStatuses)[number]

export const adminOrderActions = [
  'ACCEPT',
  'START_PREPARING',
  'START_DELIVERY',
  'COMPLETE',
  'APPROVE_REFUND',
  'REJECT_REFUND',
] as const
export type AdminOrderAction = (typeof adminOrderActions)[number]

export const customerOrderActions = ['REQUEST_REFUND'] as const
export type CustomerOrderAction = (typeof customerOrderActions)[number]

export const systemOrderActions = ['SYNC_PAYMENT_PAID', 'SYNC_PAYMENT_CLOSED'] as const
export type SystemOrderAction = (typeof systemOrderActions)[number]

export type OrderWorkflowAction = AdminOrderAction | CustomerOrderAction | SystemOrderAction

export const operatorTypes = ['ADMIN', 'CUSTOMER', 'SYSTEM'] as const
export type OperatorType = (typeof operatorTypes)[number]

export interface OrderWorkflowSnapshot {
  status?: string | null
  fulfillmentStatus?: string | null
  refundStatus?: string | null
}

export interface OrderWorkflowOperator {
  operatorId: string
  operatorName: string
  operatorType: OperatorType
  requestId?: string
}

export interface OrderWorkflowRemark {
  reason?: string
  remark?: string
}

export const orderActionPermissionMap: Record<AdminOrderAction, string> = {
  ACCEPT: 'commerce:order:accept',
  START_PREPARING: 'commerce:order:prepare',
  START_DELIVERY: 'commerce:order:deliver',
  COMPLETE: 'commerce:order:complete',
  APPROVE_REFUND: 'commerce:order:refund:approve',
  REJECT_REFUND: 'commerce:order:refund:reject',
}

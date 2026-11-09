import type {
  AdminOrderAction,
  CustomerOrderAction,
  FulfillmentStatus,
  OperatorType,
  OrderWorkflowAction,
  PaymentStatus,
  RefundStatus,
} from '@elm-platform/contracts/order'

export type { AdminOrderAction, CustomerOrderAction, FulfillmentStatus, OperatorType, OrderWorkflowAction, RefundStatus }
export type PaymentOrderStatus = PaymentStatus

export interface OrderActionLogItem {
  id: number
  orderNo: string
  operatorId: string
  operatorName: string
  operatorType: 'ADMIN' | 'CUSTOMER' | 'SYSTEM'
  action: string
  fromFulfillmentStatus: FulfillmentStatus | null
  toFulfillmentStatus: FulfillmentStatus | null
  fromRefundStatus: RefundStatus | null
  toRefundStatus: RefundStatus | null
  reason: string | null
  remark: string | null
  requestId: string | null
  createdAt: string
}

export interface OrderItem {
  id: number
  orderNo: string
  userId: string
  shopId: string | null
  shopName: string
  status: PaymentOrderStatus | string
  tradeStatus: string
  fulfillmentStatus: FulfillmentStatus
  refundStatus: RefundStatus
  refundBaseFulfillmentStatus: FulfillmentStatus | null
  refundReason: string | null
  refundRejectReason: string | null
  tradeNo: string | null
  payableAmount: number
  goodsAmount: number
  deliveryFee: number
  cartItems: unknown[]
  totalQty: number
  paidAt: string | null
  acceptedAt: string | null
  preparingAt: string | null
  deliveringAt: string | null
  completedAt: string | null
  canceledAt: string | null
  refundRequestedAt: string | null
  refundedAt: string | null
  refundRejectedAt: string | null
  createdAt: string
  updatedAt: string
  availableActions: AdminOrderAction[]
  customerAvailableActions: CustomerOrderAction[]
  actionLogs?: OrderActionLogItem[]
}

import { ApiProperty } from '@nestjs/swagger'
import {
  adminOrderActions,
  customerOrderActions,
  fulfillmentStatuses,
  operatorTypes,
  paymentStatuses,
  refundStatuses,
} from '../order.types'

export class AdminOrderActionLogDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'ELMDEMO202606020001' })
  orderNo: string

  @ApiProperty({ example: '1' })
  operatorId: string

  @ApiProperty({ example: 'admin' })
  operatorName: string

  @ApiProperty({
    enum: operatorTypes,
    example: 'ADMIN',
  })
  operatorType: 'ADMIN' | 'CUSTOMER' | 'SYSTEM'

  @ApiProperty({ example: 'ACCEPT' })
  action: string

  @ApiProperty({
    enum: fulfillmentStatuses,
    nullable: true,
  })
  fromFulfillmentStatus: string | null

  @ApiProperty({
    enum: fulfillmentStatuses,
    nullable: true,
  })
  toFulfillmentStatus: string | null

  @ApiProperty({
    enum: refundStatuses,
    nullable: true,
  })
  fromRefundStatus: string | null

  @ApiProperty({
    enum: refundStatuses,
    nullable: true,
  })
  toRefundStatus: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  reason: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  remark: string | null

  @ApiProperty({
    example: 'req-admin-1',
    nullable: true,
    type: String,
  })
  requestId: string | null

  @ApiProperty({
    example: '2026-06-02T10:00:00.000Z',
    format: 'date-time',
  })
  createdAt: string
}

export class AdminOrderDetailDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'ELMDEMO202606020001' })
  orderNo: string

  @ApiProperty({ example: '42' })
  userId: string

  @ApiProperty({
    example: '1',
    nullable: true,
    type: String,
  })
  shopId: string | null

  @ApiProperty({ example: 'Demo Shop' })
  shopName: string

  @ApiProperty({
    enum: paymentStatuses,
    example: 'PAID',
  })
  status: string

  @ApiProperty({ example: 'TRADE_SUCCESS' })
  tradeStatus: string

  @ApiProperty({
    enum: fulfillmentStatuses,
    example: 'AWAITING_ACCEPTANCE',
  })
  fulfillmentStatus: string

  @ApiProperty({
    enum: refundStatuses,
    example: 'NONE',
  })
  refundStatus: string

  @ApiProperty({
    enum: fulfillmentStatuses,
    nullable: true,
  })
  refundBaseFulfillmentStatus: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  refundReason: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  refundRejectReason: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  tradeNo: string | null

  @ApiProperty({ example: 29 })
  payableAmount: number

  @ApiProperty({ example: 24 })
  goodsAmount: number

  @ApiProperty({ example: 5 })
  deliveryFee: number

  @ApiProperty({
    items: {
      additionalProperties: true,
      type: 'object',
    },
    type: 'array',
  })
  cartItems: Record<string, unknown>[]

  @ApiProperty({ example: 2 })
  totalQty: number

  @ApiProperty({
    nullable: true,
    type: String,
  })
  paidAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  acceptedAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  preparingAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  deliveringAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  completedAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  canceledAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  refundRequestedAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  refundedAt: string | null

  @ApiProperty({
    nullable: true,
    type: String,
  })
  refundRejectedAt: string | null

  @ApiProperty({
    example: '2026-06-02T09:55:00.000Z',
    format: 'date-time',
  })
  createdAt: string

  @ApiProperty({
    example: '2026-06-02T10:00:00.000Z',
    format: 'date-time',
  })
  updatedAt: string

  @ApiProperty({
    enum: adminOrderActions,
    isArray: true,
  })
  availableActions: string[]

  @ApiProperty({
    enum: customerOrderActions,
    isArray: true,
  })
  customerAvailableActions: string[]

  @ApiProperty({
    type: [AdminOrderActionLogDto],
  })
  actionLogs: AdminOrderActionLogDto[]
}

export class AdminOrderDetailHttpResponseDto {
  @ApiProperty({ example: 200 })
  code: number

  @ApiProperty({ example: 'success' })
  message: string

  @ApiProperty({ type: AdminOrderDetailDto })
  data: AdminOrderDetailDto

  @ApiProperty({ example: '2026-06-08T00:00:00.000Z' })
  timestamp: string
}

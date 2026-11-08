import { ApiProperty } from '@nestjs/swagger'

export class PaymentCartItemResponseDto {
  @ApiProperty({
    description: '商品项 ID',
    example: 'item-001',
  })
  itemId: string

  @ApiProperty({
    description: 'SKU ID',
    example: 'sku-001',
  })
  skuId: string

  @ApiProperty({
    description: '商品标题',
    example: '香辣鸡腿堡',
  })
  title: string

  @ApiProperty({
    description: '数量',
    example: 2,
  })
  qty: number

  @ApiProperty({
    description: '单价',
    example: 19.9,
  })
  unitPrice: number

  @ApiProperty({
    description: '小计金额',
    example: 39.8,
  })
  totalPrice: number
}

export class PaymentOrderSummaryResponseDto {
  @ApiProperty({
    description: '订单 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '订单号',
    example: 'ELMALI202605241200000001',
  })
  orderNo: string

  @ApiProperty({
    description: '用户 ID',
    example: '1',
  })
  userId: string

  @ApiProperty({
    description: '店铺 ID',
    example: 'shop-001',
    nullable: true,
    type: String,
  })
  shopId: string | null

  @ApiProperty({
    description: '店铺名称',
    example: '麦当劳',
  })
  shopName: string

  @ApiProperty({
    description: '订单状态：PENDING 待支付, PAID 已支付, CLOSED 已关闭',
    example: 'PENDING',
  })
  status: string

  @ApiProperty({
    description: '支付宝交易状态',
    example: 'WAIT_BUYER_PAY',
  })
  tradeStatus: string

  @ApiProperty({
    description: '履约状态',
    example: 'PENDING_PAYMENT',
  })
  fulfillmentStatus: string

  @ApiProperty({
    description: '退款状态',
    example: 'NONE',
  })
  refundStatus: string

  @ApiProperty({
    description: '退款基准履约状态',
    nullable: true,
    type: String,
  })
  refundBaseFulfillmentStatus: string | null

  @ApiProperty({
    description: '退款原因',
    nullable: true,
    type: String,
  })
  refundReason: string | null

  @ApiProperty({
    description: '退款驳回原因',
    nullable: true,
    type: String,
  })
  refundRejectReason: string | null

  @ApiProperty({
    description: '应付金额',
    example: 39.8,
  })
  payableAmount: number

  @ApiProperty({
    description: '商品金额',
    example: 39.8,
  })
  goodsAmount: number

  @ApiProperty({
    description: '配送费',
    example: 0,
  })
  deliveryFee: number

  @ApiProperty({
    description: '购物车商品列表',
    type: [PaymentCartItemResponseDto],
  })
  cartItems: PaymentCartItemResponseDto[]

  @ApiProperty({
    description: '总数量',
    example: 2,
  })
  totalQty: number

  @ApiProperty({
    description: '支付时间',
    nullable: true,
    format: 'date-time',
  })
  paidAt: Date | null

  @ApiProperty({
    description: '接单时间',
    nullable: true,
    format: 'date-time',
  })
  acceptedAt: Date | null

  @ApiProperty({
    description: '备餐时间',
    nullable: true,
    format: 'date-time',
  })
  preparingAt: Date | null

  @ApiProperty({
    description: '配送时间',
    nullable: true,
    format: 'date-time',
  })
  deliveringAt: Date | null

  @ApiProperty({
    description: '完成时间',
    nullable: true,
    format: 'date-time',
  })
  completedAt: Date | null

  @ApiProperty({
    description: '取消时间',
    nullable: true,
    format: 'date-time',
  })
  canceledAt: Date | null

  @ApiProperty({
    description: '退款申请时间',
    nullable: true,
    format: 'date-time',
  })
  refundRequestedAt: Date | null

  @ApiProperty({
    description: '退款时间',
    nullable: true,
    format: 'date-time',
  })
  refundedAt: Date | null

  @ApiProperty({
    description: '退款驳回时间',
    nullable: true,
    format: 'date-time',
  })
  refundRejectedAt: Date | null

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date

  @ApiProperty({
    description: '更新时间',
    format: 'date-time',
  })
  updatedAt: Date

  @ApiProperty({
    description: '支付宝交易号',
    nullable: true,
    type: String,
  })
  tradeNo: string | null

  @ApiProperty({
    description: '管理员可用操作',
    type: [String],
  })
  availableActions: string[]

  @ApiProperty({
    description: '用户可用操作',
    type: [String],
  })
  customerAvailableActions: string[]
}

export class PaymentOrdersResponseDto {
  @ApiProperty({
    description: '订单列表',
    type: [PaymentOrderSummaryResponseDto],
  })
  orders: PaymentOrderSummaryResponseDto[]
}

export class AlipayWapPaymentResponseDto {
  @ApiProperty({
    description: '支付订单号',
    example: 'ELMALI202605241200000001',
  })
  orderNo: string

  @ApiProperty({
    description: '唤起支付宝的支付链接',
    example: 'https://openapi.alipaydev.com/gateway.do',
  })
  payUrl: string

  @ApiProperty({
    description: '应付金额',
    example: 39.8,
  })
  payableAmount: number
}

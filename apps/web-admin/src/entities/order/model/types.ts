export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'CLOSED'

export interface OrderItem {
  id: number
  orderNo: string
  userId: string
  shopId: string | null
  shopName: string
  status: PaymentOrderStatus | string
  tradeStatus: string
  tradeNo: string | null
  payableAmount: number
  goodsAmount: number
  deliveryFee: number
  cartItems: unknown[]
  totalQty: number
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

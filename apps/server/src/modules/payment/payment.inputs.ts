/** 单个购物车项，字段与 PaymentCartItemDto 一致，但不依赖 class-validator/Swagger。 */
export interface PaymentCartItemInput {
  shopId?: string
  shopName?: string
  itemId?: string
  id?: string
  skuId?: string
  title?: string
  name?: string
  qty: number
  unitPrice: number
}

/** 支付宝 WAP 建单入参（含调用者身份）。 */
export interface AlipayWapCreatePayload {
  userId: string
  shopId?: string
  shopName?: string
  deliveryFee: number
  cartItems: PaymentCartItemInput[]
}

/** 继续支付入参（含调用者身份）。 */
export interface AlipayWapResumePayload {
  userId: string
  orderNo: string
}

function toPrice(value) {
  const amount = Number.parseFloat(value)
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0
}

function toQty(value) {
  const qty = Number.parseInt(value, 10)
  return Number.isFinite(qty) && qty > 0 ? qty : 0
}

export function normalizeCartItems(items = []) {
  return items
    .map((item) => {
      const qty = toQty(item.qty)
      const unitPrice = toPrice(item.unitPrice)

      return {
        itemId: String(item.itemId || item.id || ''),
        skuId: String(item.skuId || item.itemId || item.id || ''),
        title: String(item.title || item.name || '商品'),
        qty,
        unitPrice,
        totalPrice: toPrice(unitPrice * qty),
      }
    })
    .filter(item => item.itemId && item.qty > 0 && item.unitPrice > 0)
}

export function buildOrderPayload(payload = {}) {
  const cartItems = normalizeCartItems(payload.cartItems)
  const goodsAmount = toPrice(
    cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
  )
  const deliveryFee = toPrice(payload.deliveryFee)
  const payableAmount = toPrice(goodsAmount + deliveryFee)
  const shopName = String(payload.shopName || '饿了么订单')
  const shopId = String(payload.shopId || '')
  const userId = String(payload.userId || payload.user_id || '')

  return {
    userId,
    shopId,
    shopName,
    cartItems,
    goodsAmount,
    deliveryFee,
    payableAmount,
  }
}

export function createOrderNo() {
  const stamp = Date.now().toString()
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `ELMALI${stamp}${random}`
}

export function mapTradeStatus(tradeStatus) {
  switch (tradeStatus) {
    case 'TRADE_SUCCESS':
    case 'TRADE_FINISHED':
      return 'PAID'
    case 'TRADE_CLOSED':
      return 'CLOSED'
    case 'WAIT_BUYER_PAY':
    default:
      return 'PENDING'
  }
}

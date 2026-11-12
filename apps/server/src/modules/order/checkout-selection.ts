// 同 SKU 合并后及整单总量都受限，不能靠拆成多行绕过一次结算的数量限制。
export const MAX_CHECKOUT_ITEM_QTY = 99
export const MAX_CHECKOUT_TOTAL_QTY = 99
const MAX_PRISMA_INT_ID = 2_147_483_647
const MAX_CHECKOUT_ID_LENGTH = 128

export interface CheckoutCartItem {
  itemId: string
  skuId: string
  qty: number
}

export interface CheckoutSelection {
  shopId: string
  cartItems: readonly CheckoutCartItem[]
}

export interface NormalizedCheckoutSelection {
  shopId: string
  cartItems: CheckoutCartItem[]
}

export function assertCatalogId(value: string): number {
  if (typeof value !== 'string' || value.trim() !== value || !/^[1-9]\d{0,9}$/.test(value))
    throw new RangeError('商家和商品 ID 必须是正整数字符串')
  const id = Number(value)
  if (id > MAX_PRISMA_INT_ID)
    throw new RangeError('商家和商品 ID 超出本地目录范围')
  return id
}

function assertOpaqueId(value: string, name: string): void {
  if (typeof value !== 'string' || !value.length || value.length > MAX_CHECKOUT_ID_LENGTH || value.trim() !== value)
    throw new RangeError(`${name} 必须是非空且不超过 ${MAX_CHECKOUT_ID_LENGTH} 字符的标识`)
}

/** 只保留商品身份和数量；建单重试比较不能因菜单改价或客户端标题变化而变成另一份选择。 */
export function normalizeCheckoutSelection(selection: CheckoutSelection): NormalizedCheckoutSelection {
  if (!selection || typeof selection !== 'object')
    throw new RangeError('缺少结算选择')
  assertCatalogId(selection.shopId)
  if (!Array.isArray(selection.cartItems) || !selection.cartItems.length || selection.cartItems.length > MAX_CHECKOUT_TOTAL_QTY)
    throw new RangeError('结算商品不能为空或超过数量上限')

  const items = new Map<string, CheckoutCartItem>()
  let totalQty = 0
  for (const item of selection.cartItems) {
    if (!item || typeof item !== 'object')
      throw new RangeError('结算商品格式无效')
    assertCatalogId(item.itemId)
    assertOpaqueId(item.skuId, 'SKU ID')
    if (!Number.isSafeInteger(item.qty) || item.qty <= 0 || item.qty > MAX_CHECKOUT_ITEM_QTY)
      throw new RangeError(`商品数量必须是 1 到 ${MAX_CHECKOUT_ITEM_QTY} 的整数`)

    const key = JSON.stringify([item.itemId, item.skuId])
    const qty = (items.get(key)?.qty || 0) + item.qty
    if (qty > MAX_CHECKOUT_ITEM_QTY)
      throw new RangeError('同一商品规格合并后的数量超过上限')
    totalQty += item.qty
    if (totalQty > MAX_CHECKOUT_TOTAL_QTY)
      throw new RangeError('整单商品数量超过上限')
    items.set(key, {
      itemId: item.itemId,
      skuId: item.skuId,
      qty,
    })
  }

  const cartItems = [...items.values()].sort((left, right) => {
    if (left.itemId !== right.itemId)
      return left.itemId < right.itemId ? -1 : 1
    if (left.skuId !== right.skuId)
      return left.skuId < right.skuId ? -1 : 1
    return 0
  })
  return {
    shopId: selection.shopId,
    cartItems,
  }
}

/** 这里只编码用户隔离的键；真正的并发去重仍要由建单方写数据库唯一约束并处理冲突。 */
export function createCheckoutRequestKey(userId: string, requestId: string): string {
  assertOpaqueId(userId, '消费者 ID')
  assertOpaqueId(requestId, '结算请求 ID')
  return JSON.stringify([userId, requestId])
}

export function areCheckoutSelectionsEqual(left: CheckoutSelection, right: CheckoutSelection): boolean {
  return JSON.stringify(normalizeCheckoutSelection(left)) === JSON.stringify(normalizeCheckoutSelection(right))
}

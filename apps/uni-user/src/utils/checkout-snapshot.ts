import type { CartStore } from './cart'

export const MAX_CHECKOUT_ITEM_QTY = 99
export const MAX_CHECKOUT_TOTAL_QTY = 99

export interface CheckoutItemSelection {
  readonly itemId: string
  readonly skuId: string
  readonly qty: number
}

export interface CheckoutSnapshotInput {
  readonly userId: string
  readonly requestId: string
  readonly shopId: string
  readonly cartItems: readonly CheckoutItemSelection[]
}

export interface CheckoutSnapshot extends CheckoutSnapshotInput {
  readonly orderNo?: string
  readonly consumed: boolean
}

export interface CheckoutSnapshotState {
  // 已消费记录也保留；接入方若付款后删掉它，旧 PAID 查询便能再次扣掉后来新增的商品。
  readonly snapshots: readonly CheckoutSnapshot[]
}

export interface CheckoutOrderBinding {
  readonly userId: string
  readonly requestId: string
  readonly orderNo: string
}

export interface ConfirmedCheckoutOrder {
  readonly userId: string
  readonly orderNo: string
  readonly shopId: string
  readonly status: string
}

export interface PaidCheckoutInput {
  readonly userId: string
  readonly order: ConfirmedCheckoutOrder
}

export interface PaidCheckoutResult {
  readonly state: CheckoutSnapshotState
  readonly stores: CartStore[]
  readonly consumed: boolean
}

function requireIdentity(value: string, field: string): void {
  if (typeof value !== 'string' || !value || value.trim() !== value || value.length > 128)
    throw new Error(`${field} 必须是无首尾空白且不超过 128 字符的非空字符串`)
}

function requireCatalogId(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim() !== value || !/^[1-9]\d*$/.test(value) || Number(value) > 2147483647)
    throw new Error(`${field} 必须是不超过 2147483647 的正整数字符串`)
}

function itemKey(item: Pick<CheckoutItemSelection, 'itemId' | 'skuId'>): string {
  return JSON.stringify([item.itemId, item.skuId])
}

/** 同一商品和 SKU 合并后再检查上限，避免拆成多条选择绕过数量限制。 */
function normalizeSelection(cartItems: readonly CheckoutItemSelection[]): CheckoutItemSelection[] {
  if (!Array.isArray(cartItems) || cartItems.length === 0)
    throw new Error('结算商品不能为空')

  const items = new Map<string, CheckoutItemSelection>()
  let totalQty = 0
  for (const item of cartItems) {
    requireCatalogId(item?.itemId, 'itemId')
    requireIdentity(item?.skuId, 'skuId')
    if (!Number.isSafeInteger(item.qty) || item.qty <= 0 || item.qty > MAX_CHECKOUT_ITEM_QTY)
      throw new Error(`qty 必须是 1 到 ${MAX_CHECKOUT_ITEM_QTY} 的整数`)

    const key = itemKey(item)
    const qty = (items.get(key)?.qty ?? 0) + item.qty
    if (qty > MAX_CHECKOUT_ITEM_QTY)
      throw new Error(`同一商品和 SKU 的数量不能超过 ${MAX_CHECKOUT_ITEM_QTY}`)

    totalQty += item.qty
    if (totalQty > MAX_CHECKOUT_TOTAL_QTY)
      throw new Error(`整单商品数量不能超过 ${MAX_CHECKOUT_TOTAL_QTY}`)

    items.set(key, {
      itemId: item.itemId,
      skuId: item.skuId,
      qty,
    })
  }

  return [...items.values()].sort((left, right) => {
    const leftKey = itemKey(left)
    const rightKey = itemKey(right)
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
  })
}

function sameSelection(snapshot: CheckoutSnapshot, input: CheckoutSnapshotInput): boolean {
  return snapshot.shopId === input.shopId
    && snapshot.cartItems.length === input.cartItems.length
    && snapshot.cartItems.every((item, index) => {
      const other = input.cartItems[index]
      return item.itemId === other.itemId && item.skuId === other.skuId && item.qty === other.qty
    })
}

function cloneSnapshot(snapshot: CheckoutSnapshot): CheckoutSnapshot {
  return {
    ...snapshot,
    cartItems: snapshot.cartItems.map(item => ({ ...item })),
  }
}

function cloneState(state: CheckoutSnapshotState): CheckoutSnapshotState {
  return {
    snapshots: state.snapshots.map(cloneSnapshot),
  }
}

export function createCheckoutSnapshotState(): CheckoutSnapshotState {
  return {
    snapshots: [],
  }
}

/** 建单前登记；响应未知时沿原 requestId 重试，不能把新选择覆盖到旧订单草稿里。 */
export function registerCheckoutSnapshot(
  state: CheckoutSnapshotState,
  input: CheckoutSnapshotInput,
): CheckoutSnapshotState {
  requireIdentity(input.userId, 'userId')
  requireIdentity(input.requestId, 'requestId')
  requireCatalogId(input.shopId, 'shopId')
  const selection: CheckoutSnapshotInput = {
    userId: input.userId,
    requestId: input.requestId,
    shopId: input.shopId,
    cartItems: normalizeSelection(input.cartItems),
  }
  const existing = state.snapshots.find(snapshot =>
    snapshot.userId === input.userId && snapshot.requestId === input.requestId,
  )

  if (existing) {
    if (!sameSelection(existing, selection))
      throw new Error('同一用户和 requestId 不能登记不同的结算选择')

    return cloneState(state)
  }

  return {
    snapshots: [
      ...state.snapshots.map(cloneSnapshot),
      {
        ...selection,
        consumed: false,
      },
    ],
  }
}

/** 建单响应到达后绑定原草稿；同一单号只能属于一张快照，换 requestId 也不能重复扣车。 */
export function bindCheckoutOrder(
  state: CheckoutSnapshotState,
  input: CheckoutOrderBinding,
): CheckoutSnapshotState {
  requireIdentity(input.userId, 'userId')
  requireIdentity(input.requestId, 'requestId')
  requireIdentity(input.orderNo, 'orderNo')
  const index = state.snapshots.findIndex(snapshot =>
    snapshot.userId === input.userId && snapshot.requestId === input.requestId,
  )
  if (index === -1)
    throw new Error('找不到当前用户的结算快照')

  const snapshot = state.snapshots[index]
  if (snapshot.orderNo && snapshot.orderNo !== input.orderNo)
    throw new Error('已绑定的结算快照不能改绑其他订单')

  if (state.snapshots.some((other, otherIndex) =>
    otherIndex !== index && other.orderNo === input.orderNo,
  )) {
    throw new Error('订单已经绑定到其他结算快照')
  }

  return {
    snapshots: state.snapshots.map((other, otherIndex) => ({
      ...cloneSnapshot(other),
      ...(otherIndex === index ? { orderNo: input.orderNo } : {}),
    })),
  }
}

/**
 * 只接后端已确认的摘要，不能把收银台回调直接当 PAID；本函数不验证网络来源。
 * 仅比较现存商品与 SKU 数量，付款期间删掉再重加同 SKU 无法识别为新一代商品。
 * 接入方需把返回的车与消费标记一起保存，纯函数本身不保证重启或断电时的落盘原子性。
 */
export function consumePaidCheckout(
  state: CheckoutSnapshotState,
  stores: readonly CartStore[],
  input: PaidCheckoutInput,
): PaidCheckoutResult {
  const nextState = cloneState(state)
  const nextStores = stores.map(store => ({
    ...store,
    products: store.products.map(product => ({ ...product })),
  }))
  const unchanged: PaidCheckoutResult = {
    state: nextState,
    stores: nextStores,
    consumed: false,
  }
  const order = input.order
  if (typeof input.userId !== 'string' || !input.userId
    || input.userId.trim() !== input.userId || input.userId.length > 128
    || typeof order.orderNo !== 'string' || !order.orderNo.trim()
    || order.status !== 'PAID' || order.userId !== input.userId) {
    return unchanged
  }

  const index = state.snapshots.findIndex(snapshot =>
    snapshot.userId === input.userId && snapshot.orderNo === order.orderNo,
  )
  const snapshot = state.snapshots[index]
  if (!snapshot || snapshot.consumed || snapshot.shopId !== order.shopId)
    return unchanged

  // 多条车记录即使意外拥有相同商品键，也只能共享这一份扣减额度，不能每条各扣一次。
  const remaining = new Map(snapshot.cartItems.map(item => [itemKey(item), item.qty]))
  const consumedStores = nextStores.flatMap((store) => {
    if (store.id !== snapshot.shopId)
      return [store]

    const products = store.products.flatMap((product) => {
      const key = itemKey(product)
      const qty = remaining.get(key) ?? 0
      if (qty === 0 || !Number.isSafeInteger(product.quantity) || product.quantity <= 0)
        return [product]

      const deducted = Math.min(product.quantity, qty)
      remaining.set(key, qty - deducted)
      const quantity = product.quantity - deducted
      return quantity > 0
        ? [{
            ...product,
            quantity,
          }]
        : []
    })

    return products.length > 0
      ? [{
          ...store,
          products,
        }]
      : []
  })

  return {
    state: {
      // 商品已被用户删掉也要记消费；否则后续重加商品会被旧 PAID 查询悄悄扣掉。
      snapshots: nextState.snapshots.map((other, otherIndex) =>
        otherIndex === index
          ? {
              ...other,
              consumed: true,
            }
          : other,
      ),
    },
    stores: consumedStores,
    consumed: true,
  }
}

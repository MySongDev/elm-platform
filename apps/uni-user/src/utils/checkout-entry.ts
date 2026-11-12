import type { CartStore } from './cart'
import type { CheckoutItemSelection, CheckoutSnapshotState } from './checkout-snapshot'

/**
 * 结算入口要交给建单接口的最小选择：单一商家 + 商品数量。
 *
 * 微信建单只认一个 shopId（后端按单一商家查价），所以这里在**前端就**把多商家拦下来，
 * 而不是让后端在第一家店算出总价、丢掉其他店的商品——那样用户会付了钱却少收到商品。
 */
export interface CheckoutSelectionDraft {
  readonly shopId: string
  readonly shopName: string
  readonly cartItems: readonly CheckoutItemSelection[]
}

export interface CrossShopCheckoutInfo {
  readonly shopIds: readonly string[]
  readonly shopNames: readonly string[]
}

let requestIdCounter = 0

/**
 * 生成建单用的 requestId。同一份选择重试时必须沿用旧 ID，所以调用方要把它持久化到快照里，
 * 这里只负责「一次新结算」的初始值。
 *
 * 加计数器是因为同一毫秒内连续点两次也能生成不同 ID；
 * 时间戳 + 随机段则保证 App 重启后仍不会撞上历史值。
 */
export function createCheckoutRequestId(now: number = Date.now(), random: number = Math.random()): string {
  requestIdCounter = (requestIdCounter + 1) % 1000
  const suffix = Math.floor(Math.abs(random) * 0x100000000).toString(36).padStart(7, '0').slice(0, 7)
  return `req_${now.toString(36)}_${requestIdCounter.toString(36)}_${suffix}`
}

/**
 * 从勾选商品推导出单一商家的结算选择。
 *
 * `checkoutItems` 是购物车页已经摊平的勾选结果（每个商品带 shopId）。
 * 混了多个商家时**返回 null 而不是取第一家**：取第一家会让其余商品免单或让订单金额与用户看到的不符。
 */
export function buildSingleShopSelection(
  checkoutItems: readonly {
    shopId?: unknown
    shopName?: unknown
    itemId?: unknown
    skuId?: unknown
    qty?: unknown
  }[],
): CheckoutSelectionDraft | null {
  if (!Array.isArray(checkoutItems) || checkoutItems.length === 0)
    return null

  const shopIds = new Set<string>()
  const shopNames = new Map<string, string>()
  const items: CheckoutItemSelection[] = []

  for (const item of checkoutItems) {
    const shopId = String(item?.shopId ?? '')
    const itemId = String(item?.itemId ?? '')
    const skuId = String(item?.skuId ?? '')
    const qty = Number(item?.qty ?? 0)
    if (!shopId || !itemId || !skuId || !Number.isSafeInteger(qty) || qty <= 0)
      return null

    shopIds.add(shopId)
    if (!shopNames.has(shopId))
      shopNames.set(shopId, String(item?.shopName ?? ''))

    items.push({
      itemId,
      skuId,
      qty,
    })
  }

  // 多商家：交给调用方提示用户分开结算，不能自动选一家。
  if (shopIds.size !== 1)
    return null

  const shopId = [...shopIds][0]
  return {
    shopId,
    shopName: shopNames.get(shopId) || '当前商家',
    cartItems: items,
  }
}

/** 只知道「混了几个商家」、不知道该提示什么时用它；返回 null 表示单一商家或空选择。 */
export function describeCrossShopCheckout(
  checkoutItems: readonly {
    shopId?: unknown
    shopName?: unknown
  }[],
): CrossShopCheckoutInfo | null {
  const shopNames = new Map<string, string>()
  for (const item of checkoutItems ?? []) {
    const shopId = String(item?.shopId ?? '')
    if (!shopId || shopNames.has(shopId))
      continue
    shopNames.set(shopId, String(item?.shopName ?? ''))
  }

  if (shopNames.size <= 1)
    return null

  return {
    shopIds: [...shopNames.keys()],
    shopNames: Array.from(shopNames.values(), name => name || '未命名商家'),
  }
}

/**
 * 找出当前用户在某商家下「尚未付款、可以继续用」的快照。
 *
 * 存在多个时取最新的一个：用户改完购物车又点了一次结算，
 * 新快照代表他这次真正想买的东西，旧草稿留着只用于恢复旧订单号。
 */
export function findPendingCheckoutSnapshot(
  state: CheckoutSnapshotState,
  input: {
    userId: string
    shopId: string
  },
): CheckoutSnapshotState['snapshots'][number] | null {
  const candidates = state.snapshots.filter(snapshot =>
    snapshot.userId === input.userId
    && snapshot.shopId === input.shopId
    && !snapshot.consumed,
  )

  return candidates.length > 0 ? candidates.at(-1) : null
}

/**
 * 换账号时必须丢掉别人的快照，否则新用户会看到上一个用户遗留的订单号/requestId。
 * 消费记录也一起清——它们只对本账号的购物车有意义。
 */
export function discardSnapshotsOfOtherUsers(
  state: CheckoutSnapshotState,
  userId: string,
): CheckoutSnapshotState {
  const kept = state.snapshots.filter(snapshot => snapshot.userId === userId)
  if (kept.length === state.snapshots.length)
    return state

  return {
    snapshots: kept,
  }
}

/**
 * 购物车里的商品是否还在该商家的车里。
 *
 * 用于判断快照是否已经过期（用户清空了这家店的车），
 * 过期快照继续拿来建单会生成一张用户看不到商品的订单。
 */
export function isSnapshotShopPresent(stores: readonly CartStore[], shopId: string): boolean {
  return stores.some(store => String(store.id) === shopId && store.products.length > 0)
}

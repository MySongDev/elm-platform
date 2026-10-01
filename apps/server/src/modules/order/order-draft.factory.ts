import type { PrismaService } from '../../prisma/prisma.service'
import type { FulfillmentStatus, PaymentStatus, RefundStatus } from './order.types'

/**
 * 建单的共用机制层（归一化 + 落库），供两个建单入口调用：
 *
 * 1. `POST /api/orders`（`OrderWorkflowService.createOrder`）—— 只建 PENDING 订单，不绑定任何支付渠道；
 * 2. `POST /api/payments/alipay/wap/create`（`PaymentService.createAlipayWapPayment`）—— 建单后紧接着生成支付宝支付链接。
 *
 * 为什么会有两个建单入口、以及为什么它们必须产出完全相同的订单行，
 * 见 `payment.service.ts` 里 `createAlipayWapPayment` 上方的说明。
 *
 * 本文件是纯函数 + 显式传入 prisma 的形式（而不是注入式 service），
 * 这样 `PaymentService` 不需要新增构造依赖，其现有单测的 prisma mock 与断言可原样保持。
 */

/**
 * 建单入参里的单个购物车项。
 *
 * 同时接受 `itemId`/`id` 与 `title`/`name` 两套字段名，因为两个建单入口收到的是
 * 同一份前端购物车结构（`normalizeOrderCartItem` 会把它归一化到 `itemId`/`title`）。
 */
export interface OrderCartItemInput {
  id?: string
  itemId?: string
  name?: string
  qty?: unknown
  skuId?: string
  title?: string
  unitPrice?: unknown
}

export interface OrderDraftInput {
  cartItems?: OrderCartItemInput[]
  deliveryFee?: unknown
  shopId?: unknown
  shopName?: unknown
  userId?: unknown
}

export interface NormalizedOrderCartItem {
  itemId: string
  qty: number
  skuId: string
  title: string
  totalPrice: number
  unitPrice: number
}

export interface OrderDraft {
  cartItems: NormalizedOrderCartItem[]
  deliveryFee: number
  goodsAmount: number
  payableAmount: number
  shopId: string | null
  shopName: string
  userId: string
}

export interface InsertPendingOrderParams {
  draft: OrderDraft
  orderNo: string
  subject: string
  tenantId: number | null
}

interface PendingOrderInitialState {
  fulfillmentStatus: FulfillmentStatus
  refundStatus: RefundStatus
  status: PaymentStatus
}

/**
 * 新订单落库时的初始状态三元组。
 *
 * 类型取自 `@elm-platform/contracts/order`（经 `./order.types` 转出），
 * 所以任何与领域契约不符的状态值都会在编译期报错，而不是静默写进数据库。
 * 两个建单入口共用这一份（经 `insertPendingOrder`），保证不会因为分叉而产出不同状态的订单。
 * 刻意不导出：外部只应通过 `insertPendingOrder` 建单，
 * 避免有人绕过它自己拼初始状态、让"两个入口订单行一致"这个约束失效。
 */
const PENDING_ORDER_INITIAL_STATE: PendingOrderInitialState = {
  fulfillmentStatus: 'PENDING_PAYMENT',
  refundStatus: 'NONE',
  status: 'PENDING',
}

/**
 * `tradeStatus` 是支付宝侧的交易状态枚举，不属于 `@elm-platform/contracts/order` 的领域契约，
 * 所以没有对应常量可复用。这里取 `'WAIT_BUYER_PAY'`：
 * - 与 Prisma schema 的列默认值一致（`prisma/schema.prisma` 的 `PaymentOrder.tradeStatus`）；
 * - 语义即"尚未支付"，`PaymentService.mapTradeStatus()` 会把它映射回 `status = 'PENDING'`。
 *
 * 未走支付宝的订单也写这个值，是为了让两个建单入口产出**完全相同**的订单行；
 * 权威状态字段是 `status`，`tradeStatus` 只在支付宝刷新/回调路径上被读取。
 */
const INITIAL_ALIPAY_TRADE_STATUS = 'WAIT_BUYER_PAY'

/** 金额归一化：Prisma Decimal / 字符串 / 数字 → 保留两位小数的 number，非法值归零。 */
export function toPrice(value: unknown) {
  const decimalLike = value as { toNumber?: () => number }
  const amount = typeof decimalLike?.toNumber === 'function'
    ? decimalLike.toNumber()
    : Number.parseFloat(String(value))
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0
}

function toQty(value: unknown) {
  const qty = Number.parseInt(String(value), 10)
  return Number.isFinite(qty) && qty > 0 ? qty : 0
}

export function buildOrderSubject(shopName: string) {
  return `${shopName} 外卖订单`
}

/**
 * 订单号前缀 `ELMALI` 是历史遗留（ELM + ALIpay），现在它也用于不含支付宝的建单入口。
 * 这里刻意不改前缀：订单号是已落库数据的一部分，改前缀会让新旧订单号形态不一致，
 * 且现有前端与测试样本都用 `ELMALI...`。
 */
export function createOrderNo() {
  const stamp = Date.now().toString()
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `ELMALI${stamp}${random}`
}

function normalizeOrderCartItem(item: OrderCartItemInput): NormalizedOrderCartItem {
  const qty = toQty(item.qty)
  const unitPrice = toPrice(item.unitPrice)

  return {
    itemId: String(item.itemId || item.id || ''),
    qty,
    skuId: String(item.skuId || item.itemId || item.id || ''),
    title: String(item.title || item.name || '商品'),
    totalPrice: toPrice(unitPrice * qty),
    unitPrice,
  }
}

/**
 * 把前端购物车归一化成可直接落库的订单草稿，并算出金额不变量：
 * `goodsAmount = Σ(item.totalPrice)`、`payableAmount = goodsAmount + deliveryFee`。
 *
 * 纯函数，不校验业务前置条件（登录态、空购物车、金额是否为正）——
 * 那些属于各入口自己的策略，错误文案也不同，留在调用方。
 */
export function buildOrderDraft(input: OrderDraftInput): OrderDraft {
  const cartItems = (input.cartItems || [])
    .map(item => normalizeOrderCartItem(item))
    .filter(item => item.itemId && item.qty > 0 && item.unitPrice > 0)
  const goodsAmount = toPrice(cartItems.reduce((sum, item) => sum + item.totalPrice, 0))
  const deliveryFee = toPrice(input.deliveryFee)

  return {
    cartItems,
    deliveryFee,
    goodsAmount,
    payableAmount: toPrice(goodsAmount + deliveryFee),
    shopId: input.shopId ? String(input.shopId) : null,
    shopName: String(input.shopName || '饿了么订单'),
    userId: String(input.userId || ''),
  }
}

/**
 * 按店铺 ID 解析租户 ID：查 `restaurants` 表取该商家的租户归属。
 *
 * 2026-09-30 改（商家数据本地化）：原实现在**内存 seed** 里按 shopId 找 tenantCode，
 * 但上游 shop id `1` 是"效果演示"（广州），seed id `1` 是"鲜花蛋糕旗舰店" —— id 撞车会
 * 把订单静默记到错误租户名下，比 tenantId=null 更危险。商家已入库，改为直接查表。
 *
 * 当前所有商家 tenantId 均为 null（平台自营），故订单也记 null —— 这是明确现状，
 * 管道保留待将来接多租户，见 docs/engineering/008-merchant-data-localization.md §8.1。
 */
export async function resolveTenantIdByShopId(prisma: PrismaService, shopId?: string | null) {
  if (!shopId)
    return null

  const numericId = Number(shopId)
  if (!Number.isFinite(numericId))
    return null

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: numericId },
    select: { tenantId: true },
  })

  return restaurant?.tenantId ?? null
}

/** 把订单草稿写成一行 PENDING 订单，返回 Prisma 创建结果。 */
export async function insertPendingOrder(prisma: PrismaService, params: InsertPendingOrderParams) {
  const {
    draft,
    orderNo,
    subject,
    tenantId,
  } = params

  return (prisma as any).paymentOrder.create({
    data: {
      cartItems: draft.cartItems,
      deliveryFee: draft.deliveryFee,
      fulfillmentStatus: PENDING_ORDER_INITIAL_STATE.fulfillmentStatus,
      goodsAmount: draft.goodsAmount,
      orderNo,
      payableAmount: draft.payableAmount,
      refundStatus: PENDING_ORDER_INITIAL_STATE.refundStatus,
      shopId: draft.shopId,
      shopName: draft.shopName,
      status: PENDING_ORDER_INITIAL_STATE.status,
      subject,
      tenantId,
      tradeStatus: INITIAL_ALIPAY_TRADE_STATUS,
      userId: draft.userId,
    },
  })
}

import type { AlipayWapCreatePayload, AlipayWapResumePayload } from './payment.inputs'
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { buildOrderDraft, buildOrderSubject, createOrderNo, insertPendingOrder, resolveTenantIdByShopId, toPrice } from '../order/order-draft.factory'
import { toOrderSummary } from '../order/order-summary.mapper'
import { OrderWorkflowService } from '../order/order-workflow.service'
import { AlipayService } from './alipay/alipay.service'

type PaymentStatus = 'PENDING' | 'PAID' | 'CLOSED'

type PaymentOrderRecord = Record<string, any>

function toDate(value: unknown) {
  if (!value)
    return null
  const normalized = String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alipay: AlipayService,
    private readonly orderWorkflow: OrderWorkflowService,
  ) {}

  /**
   * 支付宝 WAP 建单 + 生成支付链接（一体完成）。
   *
   * ## ⚠️ 为什么后端会有两个建单入口
   *
   * 本方法是**历史入口**：建单与生成支付宝支付链接绑在同一个调用里，
   * 因为 web-user（H5 端）的 `payment.vue` 是"点一次去支付"就完成建单+跳转收银台的。
   *
   * 另有 `POST /api/orders`（`OrderController` → `OrderWorkflowService.createOrder`）是**渠道无关的建单入口**，
   * 它只产出一行 PENDING 订单、不返回 payUrl。需要它的原因：
   * 支付宝 WAP 的机制是整页跳转（`window.location.href = payUrl`），微信小程序端没有 `window.location`
   * 也不允许跳出到外部页面 —— 走本方法在小程序端**机制上根本不可能**。
   * 若不给小程序端一条不含支付的建单路径，它连订单都产生不了，订单列表页永远空、无法验收。
   *
   * ## 为什么是"并存"而不是把本方法改成两步（先建单再支付）
   *
   * 迁移方案（`docs/reports/2026-09-27-uniapp迁移方案/uniapp-migration-plan.md` 议题 6 决策 2）在
   * (a) 让 H5 也改成两步 与 (b) 保留本方法旧行为 + 新增独立建单端点 之间选了 **(b)**：
   * web-user 是**在跑的生产资产**（GitHub Pages + Linux 两条部署路径），本次 uni-app 迁移的决策是
   * 两端长期并存，不该为了小程序端去改 H5。代价就是后端暂时有两个建单入口。
   *
   * ## 两个入口的一致性由什么保证
   *
   * 归一化、金额计算、初始状态、订单号、租户解析、落库字段全部收敛在
   * `../order/order-draft.factory.ts`，两个入口共用同一份实现，
   * 所以同一个购物车经任一入口建出的订单行**完全一致**（含 `tradeStatus`）。
   * 将来接入微信支付时，正确方向是把本方法改成"接已建订单 → 只生成支付链接"
   * （即复用 `resumeAlipayWapPayment` 的形状），届时可删掉这里的建单分支。
   */
  async createAlipayWapPayment(payload: AlipayWapCreatePayload) {
    // 归一化与金额计算共用 order-draft.factory，保证与 POST /api/orders 建出的订单行一致
    const draft = buildOrderDraft(payload)

    if (!draft.userId)
      throw new UnauthorizedException('请登录后再支付')
    if (!draft.cartItems.length)
      throw new BadRequestException('购物车为空，无法创建支付单')
    if (draft.payableAmount <= 0)
      throw new BadRequestException('订单金额异常，无法创建支付单')

    const orderNo = createOrderNo()
    const subject = buildOrderSubject(draft.shopName)
    const tenantId = await resolveTenantIdByShopId(this.prisma, draft.shopId)

    const order = await insertPendingOrder(this.prisma, {
      draft,
      orderNo,
      subject,
      tenantId,
    })

    const payUrl = this.alipay.createWapPayUrl({
      orderNo,
      payableAmount: draft.payableAmount,
      subject,
    })

    return {
      orderNo: order.orderNo,
      payUrl,
      payableAmount: draft.payableAmount,
    }
  }

  async getAlipayPaymentStatus(orderNo: string, refresh = true, userId?: string) {
    const order = await this.findOrder(orderNo)
    this.ensureOrderOwner(order, userId)

    if (refresh && this.alipay.hasConfig()) {
      const trade = await this.alipay.queryTrade(orderNo)
      const tradeStatus = String(trade?.trade_status || order.tradeStatus)
      const updatedOrder = await (this.prisma as any).paymentOrder.update({
        where: { orderNo },
        data: {
          tradeNo: trade?.trade_no || order.tradeNo,
          tradeStatus,
          status: this.mapTradeStatus(tradeStatus),
          queryPayload: trade || undefined,
          buyerPayAmount: trade?.buyer_pay_amount ? toPrice(trade.buyer_pay_amount) : undefined,
          paidAt: toDate(trade?.send_pay_date || trade?.gmt_payment) || order.paidAt || undefined,
        },
      })
      const syncedOrder = await this.orderWorkflow.syncPaymentStatus(updatedOrder)
      return toOrderSummary(syncedOrder)
    }

    return toOrderSummary(order)
  }

  async resumeAlipayWapPayment(payload: AlipayWapResumePayload) {
    let order = await this.findOrder(payload.orderNo)
    this.ensureOrderOwner(order, payload.userId)

    if (this.alipay.hasConfig()) {
      try {
        order = await this.refreshOrderFromAlipay(order)
      }
      catch {
        throw new BadRequestException('支付状态刷新失败，请稍后重试')
      }
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('当前订单状态不可继续支付')
    }

    const payUrl = this.alipay.createWapPayUrl({
      orderNo: order.orderNo,
      payableAmount: toPrice(order.payableAmount),
      subject: order.subject || `${order.shopName} 外卖订单`,
    })

    return {
      orderNo: order.orderNo,
      payUrl,
      payableAmount: toPrice(order.payableAmount),
    }
  }

  async handleAlipayNotify(payload: Record<string, unknown>) {
    const isValid = await this.alipay.verifyNotify(payload)
    if (!isValid)
      return false

    const orderNo = String(payload.out_trade_no || '')
    const order = await this.findOrder(orderNo)

    if (String(payload.app_id || '') !== this.alipay.getAppId())
      return false

    const sellerId = this.alipay.getSellerId()
    if (sellerId && String(payload.seller_id || '') !== sellerId)
      return false

    if (toPrice(payload.total_amount) !== toPrice(order.payableAmount))
      return false

    const tradeStatus = String(payload.trade_status || order.tradeStatus)
    const updatedOrder = await (this.prisma as any).paymentOrder.update({
      where: { orderNo },
      data: {
        tradeNo: String(payload.trade_no || order.tradeNo || ''),
        tradeStatus,
        status: this.mapTradeStatus(tradeStatus),
        notifyPayload: payload,
        paidAt: toDate(payload.gmt_payment),
      },
    })
    await this.orderWorkflow.syncPaymentStatus(updatedOrder)

    return true
  }

  private async findOrder(orderNo: string) {
    const order = await (this.prisma as any).paymentOrder.findUnique({ where: { orderNo } })
    if (!order)
      throw new NotFoundException('订单不存在')
    return order as PaymentOrderRecord
  }

  private ensureOrderOwner(order: PaymentOrderRecord, userId?: string) {
    if (userId && String(order.userId) !== String(userId)) {
      throw new UnauthorizedException('无权访问该订单')
    }
  }

  private async refreshOrderFromAlipay(order: PaymentOrderRecord) {
    const trade = await this.alipay.queryTrade(order.orderNo)
    const tradeStatus = String(trade?.trade_status || order.tradeStatus)

    const updatedOrder = await (this.prisma as any).paymentOrder.update({
      where: { orderNo: order.orderNo },
      data: {
        tradeNo: trade?.trade_no || order.tradeNo,
        tradeStatus,
        status: this.mapTradeStatus(tradeStatus),
        queryPayload: trade || undefined,
        buyerPayAmount: trade?.buyer_pay_amount ? toPrice(trade.buyer_pay_amount) : undefined,
        paidAt: toDate(trade?.send_pay_date || trade?.gmt_payment) || order.paidAt || undefined,
      },
    })

    return this.orderWorkflow.syncPaymentStatus(updatedOrder)
  }

  private mapTradeStatus(tradeStatus: string): PaymentStatus {
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
}

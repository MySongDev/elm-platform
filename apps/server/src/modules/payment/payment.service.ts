import type { CreateAlipayWapPaymentDto, PaymentCartItemDto } from './dto/create-alipay-wap-payment.dto'
import type { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AlipayService } from './alipay/alipay.service'

type PaymentStatus = 'PENDING' | 'PAID' | 'CLOSED'

type PaymentOrderRecord = Record<string, any>

interface CreateAlipayWapPaymentPayload extends CreateAlipayWapPaymentDto {
  userId: string
}

interface ResumeAlipayWapPaymentPayload extends ResumeAlipayWapPaymentDto {
  userId: string
}

function toPrice(value: unknown) {
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
  ) {}

  async createAlipayWapPayment(payload: CreateAlipayWapPaymentPayload) {
    const summary = this.buildOrderPayload(payload)

    if (!summary.userId)
      throw new UnauthorizedException('请登录后再支付')
    if (!summary.cartItems.length)
      throw new BadRequestException('购物车为空，无法创建支付单')
    if (summary.payableAmount <= 0)
      throw new BadRequestException('订单金额异常，无法创建支付单')

    const orderNo = this.createOrderNo()
    const subject = `${summary.shopName} 外卖订单`

    const order = await (this.prisma as any).paymentOrder.create({
      data: {
        orderNo,
        status: 'PENDING',
        tradeStatus: 'WAIT_BUYER_PAY',
        subject,
        userId: summary.userId,
        shopId: summary.shopId,
        shopName: summary.shopName,
        cartItems: summary.cartItems,
        goodsAmount: summary.goodsAmount,
        deliveryFee: summary.deliveryFee,
        payableAmount: summary.payableAmount,
      },
    })

    const payUrl = this.alipay.createWapPayUrl({
      orderNo,
      payableAmount: summary.payableAmount,
      subject,
    })

    return {
      orderNo: order.orderNo,
      payUrl,
      payableAmount: summary.payableAmount,
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
      return this.toOrderSummary(updatedOrder)
    }

    return this.toOrderSummary(order)
  }

  async listOrders(userId: string, limit?: unknown) {
    const take = Number.parseInt(String(limit || ''), 10)
    const orders = await (this.prisma as any).paymentOrder.findMany({
      where: { userId: String(userId) },
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number.isFinite(take) && take > 0 ? take : 20,
    })

    return { orders: orders.map((order: PaymentOrderRecord) => this.toOrderSummary(order)) }
  }

  async listAdminOrders(limit?: unknown) {
    const take = Number.parseInt(String(limit || ''), 10)
    const orders = await (this.prisma as any).paymentOrder.findMany({
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number.isFinite(take) && take > 0 ? take : 100,
    })

    return orders.map((order: PaymentOrderRecord) => this.toOrderSummary(order))
  }

  async resumeAlipayWapPayment(payload: ResumeAlipayWapPaymentPayload) {
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
    await (this.prisma as any).paymentOrder.update({
      where: { orderNo },
      data: {
        tradeNo: String(payload.trade_no || order.tradeNo || ''),
        tradeStatus,
        status: this.mapTradeStatus(tradeStatus),
        notifyPayload: payload,
        paidAt: toDate(payload.gmt_payment),
      },
    })

    return true
  }

  private buildOrderPayload(payload: CreateAlipayWapPaymentPayload) {
    const cartItems = (payload.cartItems || [])
      .map(item => this.normalizeCartItem(item))
      .filter(item => item.itemId && item.qty > 0 && item.unitPrice > 0)
    const goodsAmount = toPrice(cartItems.reduce((sum, item) => sum + item.totalPrice, 0))
    const deliveryFee = toPrice(payload.deliveryFee)

    return {
      userId: String(payload.userId || ''),
      shopId: payload.shopId ? String(payload.shopId) : null,
      shopName: String(payload.shopName || '饿了么订单'),
      cartItems,
      goodsAmount,
      deliveryFee,
      payableAmount: toPrice(goodsAmount + deliveryFee),
    }
  }

  private normalizeCartItem(item: PaymentCartItemDto) {
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

    return (this.prisma as any).paymentOrder.update({
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
  }

  private toOrderSummary(order: PaymentOrderRecord) {
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : []

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      shopId: order.shopId,
      shopName: order.shopName,
      status: order.status,
      tradeStatus: order.tradeStatus,
      payableAmount: toPrice(order.payableAmount),
      goodsAmount: toPrice(order.goodsAmount),
      deliveryFee: toPrice(order.deliveryFee),
      cartItems,
      totalQty: cartItems.reduce((sum: number, item: Record<string, any>) => sum + Number(item.qty || 0), 0),
      paidAt: order.paidAt || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      tradeNo: order.tradeNo || null,
    }
  }

  private createOrderNo() {
    const stamp = Date.now().toString()
    const random = Math.floor(Math.random() * 9000 + 1000)
    return `ELMALI${stamp}${random}`
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

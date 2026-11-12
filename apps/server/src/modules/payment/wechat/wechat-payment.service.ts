import type { CheckoutCartItem, CheckoutSelection } from '../../order/checkout-selection'
import type { WechatTransaction } from './wechat-pay.service'
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { areCheckoutSelectionsEqual, createCheckoutRequestKey, normalizeCheckoutSelection } from '../../order/checkout-selection'
import { buildOrderSubject, createOrderNo, insertPendingOrder, toPrice } from '../../order/order-draft.factory'
import { orderMajorToMinor, orderMinorToMajorString } from '../../order/order-money'
import { OrderPricingService } from '../../order/order-pricing.service'
import { toOrderSummary } from '../../order/order-summary.mapper'
import { WechatPayService } from './wechat-pay.service'

export interface WechatCreateInput {
  userId: string
  requestId: string
  shopId: string
  cartItems: CheckoutCartItem[]
}

export interface WechatResumeInput {
  userId: string
  orderNo: string
  code: string
}

type PaymentOrderRecord = Record<string, any>

/** 把落库的 cartItems（含标题/元金额）还原成只含身份与数量的结算选择，用于幂等比较。 */
function toStoredSelection(order: PaymentOrderRecord): CheckoutSelection {
  const items = Array.isArray(order.cartItems) ? order.cartItems : []
  return {
    shopId: String(order.shopId ?? ''),
    cartItems: items.map((item: any) => ({
      itemId: String(item?.itemId ?? ''),
      skuId: String(item?.skuId ?? ''),
      qty: Number(item?.qty ?? 0),
    })),
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002')
}

/**
 * 微信小程序支付的业务层：可信建单 + 原单预支付参数。
 *
 * 与协议层（WechatPayService）分工：本类决定「哪张订单、多少钱、谁能付」，
 * 协议层只负责签名/解密等微信协议细节。到账确认（查单/通知写 PAID）属于 S3，不在这里。
 */
@Injectable()
export class WechatPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: OrderPricingService,
    private readonly wechat: WechatPayService,
  ) {}

  /**
   * 微信可信建单：只接收商品选择，金额由服务端查价决定。
   *
   * 用 `checkoutRequestKey`（userId+requestId）做幂等：同一请求重试返回原单，
   * 相同键但选择不同则 409，避免把两次不同购物车合并成一张订单或少收钱。
   * 并发下靠数据库唯一约束兜底：两个请求同时建单，一个成功，另一个命中 P2002 后回读原单。
   */
  async createOrder(input: WechatCreateInput) {
    const userId = String(input.userId ?? '')
    if (!userId)
      throw new UnauthorizedException('请登录后再下单')

    const requestKey = this.buildRequestKey(userId, input.requestId)
    const selection = this.normalizeSelection(input)

    const existing = await this.findByRequestKey(requestKey)
    if (existing)
      return this.resolveSameRequest(existing, selection)

    // 未配置时不要先落一张无效订单再让预支付失败。
    this.wechat.assertConfigured()
    const priced = await this.pricing.priceSelection(selection)

    const orderNo = createOrderNo()
    const subject = buildOrderSubject(priced.shopName)
    try {
      const order = await insertPendingOrder(this.prisma, {
        draft: {
          cartItems: priced.cartItems.map(item => ({
            itemId: item.itemId,
            qty: item.qty,
            skuId: item.skuId,
            title: item.title,
            totalPrice: toPrice(orderMinorToMajorString(item.totalPriceMinor)),
            unitPrice: toPrice(orderMinorToMajorString(item.unitPriceMinor)),
          })),
          deliveryFee: toPrice(orderMinorToMajorString(priced.deliveryFeeMinor)),
          goodsAmount: toPrice(orderMinorToMajorString(priced.goodsAmountMinor)),
          payableAmount: toPrice(orderMinorToMajorString(priced.payableAmountMinor)),
          shopId: priced.shopId,
          shopName: priced.shopName,
          userId,
        },
        orderNo,
        subject,
        tenantId: priced.tenantId,
        paymentChannel: 'WECHAT',
        checkoutRequestKey: requestKey,
      })
      return toOrderSummary(order)
    }
    catch (error) {
      // 并发建单：另一个请求已抢先写入同一 requestKey，回读它按相同规则裁决。
      if (isUniqueConstraintError(error)) {
        const raced = await this.findByRequestKey(requestKey)
        if (raced)
          return this.resolveSameRequest(raced, selection)
      }
      throw error
    }
  }

  /**
   * 为已建订单生成微信预支付参数（首次支付与续付共用）。
   *
   * 先做渠道/归属/状态预检，再换 openid、下预支付单、签名。
   * 不能跳过归属与状态检查：否则任何登录用户都能拿别人的订单号发起支付。
   */
  async createPaymentParams(input: WechatResumeInput) {
    const order = await this.findOrder(input.orderNo)
    if (String(order.userId) !== String(input.userId))
      throw new UnauthorizedException('无权操作该订单')
    if (order.paymentChannel !== 'WECHAT')
      throw new BadRequestException('该订单不是微信支付订单，请重新下单')

    this.wechat.assertConfigured()

    if (order.status === 'PAID')
      throw new BadRequestException('订单已支付，请勿重复支付')
    if (order.status !== 'PENDING')
      throw new BadRequestException('当前订单状态不可继续支付')

    const totalMinor = orderMajorToMinor(toPrice(order.payableAmount))
    if (totalMinor <= 0)
      throw new BadRequestException('订单金额异常，无法发起支付')

    const openId = await this.wechat.exchangeOpenId(input.code)
    const paymentParams = await this.wechat.createJsapiPayment({
      orderNo: order.orderNo,
      subject: order.subject || `${order.shopName} 外卖订单`,
      total: totalMinor,
    }, openId)

    return {
      orderNo: order.orderNo,
      payableAmount: toPrice(order.payableAmount),
      paymentParams,
    }
  }

  /**
   * 只有成功处理才通知 Controller 回 200；失败回 500，让微信重推而不是丢账。
   * 这里返回处理结果，不让全局异常过滤器把微信失败体改成项目通用信封。
   */
  async handleNotification(headers: Record<string, string | string[] | undefined>, rawBody: Buffer) {
    let transaction: WechatTransaction
    try {
      // 先验签再解密：decodeNotification 内部按 rawBody 原始字节校验签名。
      transaction = this.wechat.decodeNotification(headers, rawBody)
    }
    catch {
      // 验签/解密失败的消息一律不可信，不能因为它去查库或改单。
      return false
    }

    try {
      await this.settlePaidTransaction(transaction, 'notify')
      return true
    }
    catch {
      // 落库失败要返回失败，让微信重推，而不是静默丢账。
      return false
    }
  }

  /**
   * 用微信侧结果刷新订单（主动查单，`refresh`）。
   *
   * 与通知共用 settlePaidTransaction，保证两条路径的金额比对和写入规则完全一致；
   * 若各写一份，很容易出现「通知校验了金额、查单忘校验」这种只在一条路径生效的漏洞。
   */
  async refreshOrderStatus(input: {
    userId: string
    orderNo: string
  }) {
    const order = await this.findOwnedWechatOrder(input)
    this.wechat.assertConfigured()

    const transaction = await this.wechat.queryTrade(order.orderNo)
    // null = 微信侧确认该单号不存在（尚未下预支付单），不是「未支付」，不能据此改状态。
    if (!transaction)
      return toOrderSummary(order)

    return toOrderSummary(await this.settlePaidTransaction(transaction, 'query'))
  }

  /** 只回本地快照，不访问微信。前端轮询里用它，避免每次都打外部接口。 */
  async getOrderStatus(input: {
    userId: string
    orderNo: string
  }) {
    return toOrderSummary(await this.findOwnedWechatOrder(input))
  }

  /**
   * 把微信侧交易结果写进本地订单——通知与主动查单的唯一写入口。
   *
   * 三个必须守住的点：
   * 1. 商户身份（appid/mchid）和订单号要能和本地对上，否则是别人的单或伪造数据。
   * 2. 金额必须等于本单应付额。微信侧金额和本地不一致说明订单被改过或通知串单，
   *    这时候标 PAID 就等于少收钱还发货。
   * 3. 并发下只能入账一次：条件更新限定 `status` 仍是 PENDING，
   *    通知重推、通知与查单同时到达都只会有一个把状态改成 PAID，另一个拿到 0 行。
   */
  private async settlePaidTransaction(transaction: WechatTransaction, source: 'notify' | 'query') {
    const identity = this.wechat.getIdentity()
    if (transaction.appid !== identity.appId || transaction.mchid !== identity.mchId)
      throw new BadRequestException('微信交易商户信息与当前商户不一致')
    if (!transaction.out_trade_no)
      throw new BadRequestException('微信交易缺少商户订单号')

    const order = await this.findOrder(transaction.out_trade_no)
    if (order.paymentChannel !== 'WECHAT')
      throw new BadRequestException('该订单不是微信支付订单')

    if (transaction.trade_state === 'CLOSED') {
      await (this.prisma as any).$transaction(async (tx: any) => {
        // 查单回来时通知可能已先入账；只有仍待支付的订单能关闭，不能覆盖 PAID/SUCCESS。
        const updated = await tx.paymentOrder.updateMany({
          where: {
            orderNo: order.orderNo,
            status: 'PENDING',
          },
          data: {
            status: 'CLOSED',
            tradeStatus: 'CLOSED',
            queryPayload: transaction,
          },
        })
        if (updated.count === 0)
          return

        await tx.paymentOrder.updateMany({
          where: {
            orderNo: order.orderNo,
            fulfillmentStatus: 'PENDING_PAYMENT',
          },
          data: {
            fulfillmentStatus: 'CANCELED',
            canceledAt: new Date(),
          },
        })
      })
      return this.findOrder(order.orderNo)
    }

    if (transaction.trade_state !== 'SUCCESS') {
      // 未支付查询可以缺少金额；迟到的 NOTPAY 也不能盖掉已入账订单的 SUCCESS。
      await (this.prisma as any).paymentOrder.updateMany({
        where: {
          orderNo: order.orderNo,
          status: 'PENDING',
        },
        data: {
          tradeStatus: transaction.trade_state,
          queryPayload: transaction,
        },
      })
      return this.findOrder(order.orderNo)
    }

    // 金额只在真要入账时比对：这里是「标 PAID 且准备发货」的唯一关口。
    const paidMinor = transaction.amount?.total
    const expectedMinor = orderMajorToMinor(toPrice(order.payableAmount))
    if (typeof paidMinor !== 'number' || paidMinor !== expectedMinor)
      throw new BadRequestException('微信交易金额与订单应付金额不一致')

    const paidAt = transaction.success_time ? new Date(transaction.success_time) : null
    const data = {
      status: 'PAID',
      tradeStatus: 'SUCCESS',
      tradeNo: transaction.transaction_id ?? order.tradeNo,
      paidAt: paidAt && !Number.isNaN(paidAt.getTime()) ? paidAt : (order.paidAt ?? new Date()),
      ...(source === 'notify' ? { notifyPayload: transaction } : { queryPayload: transaction }),
    }

    const settled = await (this.prisma as any).$transaction(async (tx: any) => {
      // 条件更新是防重复入账的关键：`status: 'PENDING'` 同时是过滤条件和前置校验。
      const updated = await tx.paymentOrder.updateMany({
        where: {
          orderNo: order.orderNo,
          status: 'PENDING',
        },
        data,
      })
      if (updated.count === 0)
        return null

      // 履约状态必须在同一事务里推进。放到事务外做的话，
      // 进程若在这两步之间崩掉，订单会停在「已付款但履约=待支付」，
      // 商家端看不到待接单，只能人工补数据。
      const settledOrder = await tx.paymentOrder.update({
        where: { orderNo: order.orderNo },
        data: { fulfillmentStatus: 'AWAITING_ACCEPTANCE' },
      })
      return settledOrder
    })

    if (settled)
      return settled

    // 没抢到更新：要么已经入账（重复通知/并发查单，属于正常），要么订单已关闭。
    const current = await this.findOrder(order.orderNo)
    if (current.status === 'PAID')
      return current

    // 已关闭的单收到成功通知：钱可能真的收了，不能假装没事，抛错让人工对账。
    throw new BadRequestException('订单当前状态无法入账，请人工核对微信交易')
  }

  private buildRequestKey(userId: string, requestId: string) {
    try {
      return createCheckoutRequestKey(userId, requestId)
    }
    catch (error) {
      if (error instanceof RangeError)
        throw new BadRequestException('结算请求标识无效')
      throw error
    }
  }

  private normalizeSelection(input: WechatCreateInput) {
    try {
      return normalizeCheckoutSelection({
        shopId: input.shopId,
        cartItems: input.cartItems,
      })
    }
    catch (error) {
      if (error instanceof RangeError)
        throw new BadRequestException(error.message)
      throw error
    }
  }

  /** 同一 requestKey 的订单必须对应同一份选择；不同则说明客户端复用了请求 ID，必须拦下。 */
  private resolveSameRequest(order: PaymentOrderRecord, selection: CheckoutSelection) {
    const stored = toStoredSelection(order)
    if (!areCheckoutSelectionsEqual(stored, selection))
      throw new ConflictException('同一结算请求不能提交不同的商品选择，请重新结算')
    return toOrderSummary(order)
  }

  private async findByRequestKey(requestKey: string) {
    return (this.prisma as any).paymentOrder.findUnique({
      where: { checkoutRequestKey: requestKey },
    }) as Promise<PaymentOrderRecord | null>
  }

  private async findOwnedWechatOrder(input: {
    userId: string
    orderNo: string
  }) {
    const order = await this.findOrder(input.orderNo)
    if (String(order.userId) !== String(input.userId))
      throw new UnauthorizedException('无权访问该订单')
    if (order.paymentChannel !== 'WECHAT')
      throw new BadRequestException('该订单不是微信支付订单')
    return order
  }

  private async findOrder(orderNo: string) {
    const order = await (this.prisma as any).paymentOrder.findUnique({ where: { orderNo } })
    if (!order)
      throw new NotFoundException('订单不存在')
    return order as PaymentOrderRecord
  }
}

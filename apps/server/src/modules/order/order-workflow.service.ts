import type { TenantContext } from '../tenant/tenant.types'
import type { OrderDraftInput } from './order-draft.factory'
import type { AdminOrderAction, FulfillmentStatus, OrderWorkflowOperator, RefundStatus } from './order.types'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TenantAccessService } from '../tenant/tenant-access.service'
import { isOrderAllowed } from './order-access.policy'
import { buildOrderDraft, buildOrderSubject, createOrderNo, insertPendingOrder, resolveTenantIdByShopId } from './order-draft.factory'
import { toOrderSummary } from './order-summary.mapper'
import { assertAdminActionAllowed, assertRefundRequestAllowed, assertRefundReviewAllowed, getNextFulfillmentStatus, normalizeFulfillmentStatus, normalizeRefundStatus } from './order-transition.policy'

type PaymentOrderRecord = Record<string, any>

interface RequestRefundPayload {
  userId: string
  reason: string
  operator: OrderWorkflowOperator
}

/** `POST /api/orders` 的入参：购物车内容 + 由守卫注入的 userId。 */
export interface CreateOrderPayload extends OrderDraftInput {
  userId: string
}

@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  /**
   * 建单（不含支付渠道）：产出一行 `PENDING` 订单并返回订单摘要。
   *
   * 这是 `POST /api/orders` 的实现，也是**渠道无关**的建单入口 —— 微信小程序端无法走支付宝 WAP
   * 的整页跳转，但仍需要能产生 PENDING 订单，否则订单列表页永远是空的、无法验收。
   *
   * ⚠️ 与 `PaymentService.createAlipayWapPayment` 是**并存的两个建单入口**，原因与约束
   * 见 `payment.service.ts` 中该方法上方的说明；两者共用 `order-draft.factory.ts`，
   * 因此产出的订单行完全一致。
   */
  async createOrder(payload: CreateOrderPayload) {
    const draft = buildOrderDraft(payload)

    if (!draft.userId)
      throw new UnauthorizedException('请登录后再下单')
    if (!draft.cartItems.length)
      throw new BadRequestException('购物车为空，无法创建订单')
    if (draft.payableAmount <= 0)
      throw new BadRequestException('订单金额异常，无法创建订单')

    const tenantId = await resolveTenantIdByShopId(this.prisma, draft.shopId)
    const order = await insertPendingOrder(this.prisma, {
      draft,
      orderNo: createOrderNo(),
      subject: buildOrderSubject(draft.shopName),
      tenantId,
    })

    return toOrderSummary(order)
  }

  async acceptOrder(orderNo: string, operator: OrderWorkflowOperator, context?: TenantContext) {
    return this.applyFulfillmentAction(orderNo, 'ACCEPT', 'acceptedAt', operator, context)
  }

  async startPreparing(orderNo: string, operator: OrderWorkflowOperator, context?: TenantContext) {
    return this.applyFulfillmentAction(orderNo, 'START_PREPARING', 'preparingAt', operator, context)
  }

  async startDelivery(orderNo: string, operator: OrderWorkflowOperator, context?: TenantContext) {
    return this.applyFulfillmentAction(orderNo, 'START_DELIVERY', 'deliveringAt', operator, context)
  }

  async completeOrder(orderNo: string, operator: OrderWorkflowOperator, context?: TenantContext) {
    return this.applyFulfillmentAction(orderNo, 'COMPLETE', 'completedAt', operator, context)
  }

  async requestRefund(orderNo: string, payload: RequestRefundPayload) {
    const order = await this.findOrder(orderNo)
    if (String(order.userId) !== String(payload.userId)) {
      throw new ForbiddenException('无权操作该订单')
    }

    assertRefundRequestAllowed(order)
    const fromFulfillmentStatus = normalizeFulfillmentStatus(order)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          refundStatus: 'REQUESTED',
          refundBaseFulfillmentStatus: fromFulfillmentStatus,
          refundReason: payload.reason,
          refundRequestedAt: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, 'REQUEST_REFUND', payload.operator, {
          reason: payload.reason,
        }),
      })

      return toOrderSummary(updated)
    })
  }

  async approveRefund(orderNo: string, operator: OrderWorkflowOperator, remark?: string, context?: TenantContext) {
    const order = await this.findOrder(orderNo, context)
    this.assertCanWrite(context)
    assertRefundReviewAllowed(order)

    // 微信订单的资金退款还没接：approveRefund 只会把状态写成 APPROVED/refundedAt，
    // 并不会真的退回钱。放行它会让「已退款」落库而钱没动，属资金误标，
    // 所以只拦新微信渠道；旧支付宝/历史 null 单保持既有行为。
    if (order.paymentChannel === 'WECHAT') {
      throw new BadRequestException('微信订单的资金退款尚未接入，暂不能标记为已退款')
    }

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          fulfillmentStatus: 'CANCELED',
          refundStatus: 'APPROVED',
          refundedAt: new Date(),
          canceledAt: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, 'APPROVE_REFUND', operator, { remark }),
      })

      return toOrderSummary(updated)
    })
  }

  async rejectRefund(orderNo: string, operator: OrderWorkflowOperator, reason: string, context?: TenantContext) {
    const order = await this.findOrder(orderNo, context)
    this.assertCanWrite(context)
    assertRefundReviewAllowed(order)
    const baseFulfillmentStatus = order.refundBaseFulfillmentStatus || normalizeFulfillmentStatus(order)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          fulfillmentStatus: baseFulfillmentStatus,
          refundStatus: 'REJECTED',
          refundRejectReason: reason,
          refundRejectedAt: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, 'REJECT_REFUND', operator, { reason }),
      })

      return toOrderSummary(updated)
    })
  }

  async syncPaymentStatus(order: PaymentOrderRecord) {
    const fulfillmentStatus = normalizeFulfillmentStatus(order)

    if (order.status === 'PAID' && fulfillmentStatus === 'PENDING_PAYMENT') {
      const updated = await (this.prisma as any).paymentOrder.update({
        where: { orderNo: order.orderNo },
        data: { fulfillmentStatus: 'AWAITING_ACCEPTANCE' },
      })
      return updated
    }

    if (order.status === 'CLOSED' && fulfillmentStatus === 'PENDING_PAYMENT') {
      const updated = await (this.prisma as any).paymentOrder.update({
        where: { orderNo: order.orderNo },
        data: {
          fulfillmentStatus: 'CANCELED',
          canceledAt: new Date(),
        },
      })
      return updated
    }

    return order
  }

  private async applyFulfillmentAction(
    orderNo: string,
    action: AdminOrderAction,
    timestampField: string,
    operator: OrderWorkflowOperator,
    context?: TenantContext,
  ) {
    const order = await this.findOrder(orderNo, context)
    this.assertCanWrite(context)
    assertAdminActionAllowed(order, action)
    const nextFulfillmentStatus = getNextFulfillmentStatus(order, action)

    return (this.prisma as any).$transaction(async (tx: any) => {
      const updated = await tx.paymentOrder.update({
        where: { orderNo },
        data: {
          fulfillmentStatus: nextFulfillmentStatus,
          [timestampField]: new Date(),
        },
      })

      await tx.orderActionLog.create({
        data: this.createLogData(order, updated, action, operator),
      })

      return toOrderSummary(updated)
    })
  }

  private async findOrder(orderNo: string, context?: TenantContext) {
    const order = await (this.prisma as any).paymentOrder.findUnique({ where: { orderNo } })
    if (!order || !isOrderAllowed(order, context, this.tenantAccess))
      throw new NotFoundException('订单不存在')
    return order as PaymentOrderRecord
  }

  private assertCanWrite(context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)
  }

  private createLogData(
    before: PaymentOrderRecord,
    after: PaymentOrderRecord,
    action: string,
    operator: OrderWorkflowOperator,
    options: {
      reason?: string
      remark?: string
    } = {},
  ) {
    return {
      orderNo: before.orderNo,
      operatorId: operator.operatorId,
      operatorName: operator.operatorName,
      operatorType: operator.operatorType,
      action,
      fromFulfillmentStatus: normalizeFulfillmentStatus(before) as FulfillmentStatus,
      toFulfillmentStatus: normalizeFulfillmentStatus(after) as FulfillmentStatus,
      fromRefundStatus: normalizeRefundStatus(before) as RefundStatus,
      toRefundStatus: normalizeRefundStatus(after) as RefundStatus,
      reason: options.reason,
      remark: options.remark,
      requestId: operator.requestId,
      tenantId: before.tenantId ?? after.tenantId ?? null,
    }
  }
}

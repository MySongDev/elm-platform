import type { TenantContext } from '../tenant/tenant.types'
import type {
  AdminOrderAction,
  FulfillmentStatus,
  OrderWorkflowOperator,
  RefundStatus,
} from './order.types'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TenantAccessService } from '../tenant/tenant-access.service'
import {
  assertAdminActionAllowed,
  assertRefundRequestAllowed,
  assertRefundReviewAllowed,
  getAdminAvailableActions,
  getCustomerAvailableActions,
  getNextFulfillmentStatus,
  normalizeFulfillmentStatus,
  normalizeRefundStatus,
} from './order-transition.policy'

type PaymentOrderRecord = Record<string, any>

interface RequestRefundPayload {
  userId: string
  reason: string
  operator: OrderWorkflowOperator
}

function toPrice(value: unknown) {
  const decimalLike = value as { toNumber?: () => number }
  const amount = typeof decimalLike?.toNumber === 'function'
    ? decimalLike.toNumber()
    : Number.parseFloat(String(value))
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0
}

@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  getAdminAvailableActions(order: PaymentOrderRecord) {
    return getAdminAvailableActions(order)
  }

  getCustomerAvailableActions(order: PaymentOrderRecord) {
    return getCustomerAvailableActions(order)
  }

  async getAdminOrderDetail(orderNo: string, context?: TenantContext) {
    const order = await this.findOrder(orderNo, context)
    const actionLogs = await (this.prisma as any).orderActionLog.findMany({
      where: this.buildOrderActionLogWhere(orderNo, context),
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      ...this.toOrderSummary(order),
      actionLogs,
    }
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

      return this.toOrderSummary(updated)
    })
  }

  async approveRefund(orderNo: string, operator: OrderWorkflowOperator, remark?: string, context?: TenantContext) {
    const order = await this.findOrder(orderNo, context)
    this.assertCanWrite(context)
    assertRefundReviewAllowed(order)

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

      return this.toOrderSummary(updated)
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

      return this.toOrderSummary(updated)
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

  toOrderSummary(order: PaymentOrderRecord) {
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : []
    const fulfillmentStatus = normalizeFulfillmentStatus(order)
    const refundStatus = normalizeRefundStatus(order)

    return {
      id: order.id,
      orderNo: order.orderNo,
      userId: order.userId,
      shopId: order.shopId,
      shopName: order.shopName,
      status: order.status,
      tradeStatus: order.tradeStatus,
      fulfillmentStatus,
      refundStatus,
      refundBaseFulfillmentStatus: order.refundBaseFulfillmentStatus || null,
      refundReason: order.refundReason || null,
      refundRejectReason: order.refundRejectReason || null,
      payableAmount: toPrice(order.payableAmount),
      goodsAmount: toPrice(order.goodsAmount),
      deliveryFee: toPrice(order.deliveryFee),
      cartItems,
      totalQty: cartItems.reduce((sum: number, item: Record<string, any>) => sum + Number(item.qty || 0), 0),
      paidAt: order.paidAt || null,
      acceptedAt: order.acceptedAt || null,
      preparingAt: order.preparingAt || null,
      deliveringAt: order.deliveringAt || null,
      completedAt: order.completedAt || null,
      canceledAt: order.canceledAt || null,
      refundRequestedAt: order.refundRequestedAt || null,
      refundedAt: order.refundedAt || null,
      refundRejectedAt: order.refundRejectedAt || null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      tradeNo: order.tradeNo || null,
      availableActions: this.getAdminAvailableActions({
        ...order,
        fulfillmentStatus,
        refundStatus,
      }),
      customerAvailableActions: this.getCustomerAvailableActions({
        ...order,
        fulfillmentStatus,
        refundStatus,
      }),
    }
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

      return this.toOrderSummary(updated)
    })
  }

  private async findOrder(orderNo: string, context?: TenantContext) {
    const order = await (this.prisma as any).paymentOrder.findUnique({ where: { orderNo } })
    if (!order || !this.isOrderAllowed(order, context))
      throw new NotFoundException('订单不存在')
    return order as PaymentOrderRecord
  }

  private assertCanWrite(context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)
  }

  private buildOrderActionLogWhere(orderNo: string, context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return { orderNo }

    this.tenantAccess.assertCanRead(context)

    if (!context.tenantId)
      throw new ForbiddenException('当前账号未绑定租户')

    return {
      orderNo,
      tenantId: context.tenantId,
    }
  }

  private isOrderAllowed(order: PaymentOrderRecord, context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return true

    this.tenantAccess.assertCanRead(context)

    if (!context.tenantId)
      throw new ForbiddenException('当前账号未绑定租户')

    if (Number(order.tenantId) !== context.tenantId)
      return false

    if (context.dataScope === 'SHOP')
      return Boolean(order.shopId && context.boundShopIds.includes(String(order.shopId)))

    return true
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

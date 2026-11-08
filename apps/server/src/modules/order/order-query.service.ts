import type { TenantContext } from '../tenant/tenant.types'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { TenantAccessService } from '../tenant/tenant-access.service'
import { isOrderAllowed } from './order-access.policy'
import { toOrderSummary } from './order-summary.mapper'

type PaymentOrderRecord = Record<string, any>

export interface AdminOrderQuery {
  tenantId?: number | string | null
  shopId?: string | number | null
}

/**
 * 订单列表和管理端详情的只读入口，不发起支付、不推进状态。
 * 消费者列表按 userId，管理端列表和详情按租户/门店上下文；两者不能混用查询范围。
 */
@Injectable()
export class OrderQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  async listOrders(userId: string, limit?: unknown) {
    const take = Number.parseInt(String(limit || ''), 10)
    const orders = await (this.prisma as any).paymentOrder.findMany({
      where: { userId: String(userId) },
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number.isFinite(take) && take > 0 ? take : 20,
    })

    return { orders: orders.map((order: PaymentOrderRecord) => toOrderSummary(order)) }
  }

  async listAdminOrders(limit?: unknown, context?: TenantContext, query: AdminOrderQuery = {}) {
    const take = Number.parseInt(String(limit || ''), 10)
    const orders = await (this.prisma as any).paymentOrder.findMany({
      where: this.buildOrderWhere(context, query),
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: Number.isFinite(take) && take > 0 ? take : 100,
    })

    return orders.map((order: PaymentOrderRecord) => toOrderSummary(order))
  }

  private buildOrderWhere(context?: TenantContext, query: AdminOrderQuery = {}) {
    if (!context)
      return undefined

    this.tenantAccess.assertCanRead(context)

    const where = this.tenantAccess.buildScopedWhere(context, query)
    return Object.keys(where).length ? where : undefined
  }

  async getAdminOrderDetail(orderNo: string, context?: TenantContext) {
    const order = await this.findOrder(orderNo, context)
    const actionLogs = await (this.prisma as any).orderActionLog.findMany({
      where: this.buildOrderActionLogWhere(orderNo, context),
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      ...toOrderSummary(order),
      actionLogs,
    }
  }

  private async findOrder(orderNo: string, context?: TenantContext) {
    const order = await (this.prisma as any).paymentOrder.findUnique({ where: { orderNo } })
    if (!order || !isOrderAllowed(order, context, this.tenantAccess))
      throw new NotFoundException('订单不存在')
    return order as PaymentOrderRecord
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
}

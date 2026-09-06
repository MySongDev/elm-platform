import type { PrismaService } from '../../prisma/prisma.service'
import type { TenantContext } from '../tenant/tenant.types'
import { TenantAccessService } from '../tenant/tenant-access.service'
import { OrderWorkflowService } from './order-workflow.service'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNo: 'ELMDEMO202606020001',
    userId: '42',
    shopId: '1',
    shopName: 'Demo Shop',
    tenantId: 10,
    status: 'PAID',
    tradeStatus: 'TRADE_SUCCESS',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
    tradeNo: '2026060222001',
    goodsAmount: { toNumber: () => 24 },
    deliveryFee: { toNumber: () => 5 },
    payableAmount: { toNumber: () => 29 },
    cartItems: [
      {
        name: 'Rice Set',
        qty: 2,
      },
    ],
    paidAt: new Date('2026-06-02T10:00:00.000Z'),
    acceptedAt: null,
    preparingAt: null,
    deliveringAt: null,
    completedAt: null,
    canceledAt: null,
    refundRequestedAt: null,
    refundedAt: null,
    refundRejectedAt: null,
    createdAt: new Date('2026-06-02T09:55:00.000Z'),
    updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    ...overrides,
  }
}

function createService(orderOverrides: Record<string, unknown> = {}) {
  const currentOrder = createOrder(orderOverrides)
  const actionLogs = [{
    id: 1,
    orderNo: currentOrder.orderNo,
    operatorId: '1',
    operatorName: 'admin',
    operatorType: 'ADMIN',
    action: 'ACCEPT',
    fromFulfillmentStatus: 'AWAITING_ACCEPTANCE',
    toFulfillmentStatus: 'ACCEPTED',
    fromRefundStatus: 'NONE',
    toRefundStatus: 'NONE',
    reason: null,
    remark: null,
    requestId: 'req-admin-1',
    createdAt: new Date('2026-06-02T10:01:00.000Z'),
  }]
  const prisma = {
    paymentOrder: {
      findUnique: jest.fn().mockResolvedValue(currentOrder),
    },
    orderActionLog: {
      findMany: jest.fn().mockResolvedValue(actionLogs),
    },
  }
  const realTenantAccess = new TenantAccessService()
  const tenantAccess = {
    assertCanRead: jest.fn(context => realTenantAccess.assertCanRead(context)),
    assertCanWrite: jest.fn(context => realTenantAccess.assertCanWrite(context)),
  }

  return {
    actionLogs,
    order: currentOrder,
    prisma,
    service: new OrderWorkflowService(
      prisma as unknown as PrismaService,
      tenantAccess as unknown as TenantAccessService,
    ),
    tenantAccess,
  }
}

const tenantContext: TenantContext = {
  boundShopIds: [],
  dataScope: 'TENANT',
  isPlatformAdmin: false,
  tenantCode: 'default',
  tenantId: 10,
  tenantName: 'Default Tenant',
  tenantStatus: 'ACTIVE',
  userId: 1,
  username: 'admin',
}

describe('admin order detail API contract', () => {
  it('returns the order detail data shape consumed by web-admin', async () => {
    const {
      actionLogs,
      prisma,
      service,
    } = createService()

    const result = await service.getAdminOrderDetail('ELMDEMO202606020001', tenantContext)

    expect(prisma.paymentOrder.findUnique).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
    })
    expect(prisma.orderActionLog.findMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ELMDEMO202606020001',
        tenantId: 10,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    expect(result).toStrictEqual({
      id: 1,
      orderNo: 'ELMDEMO202606020001',
      userId: '42',
      shopId: '1',
      shopName: 'Demo Shop',
      status: 'PAID',
      tradeStatus: 'TRADE_SUCCESS',
      fulfillmentStatus: 'AWAITING_ACCEPTANCE',
      refundStatus: 'NONE',
      refundBaseFulfillmentStatus: null,
      refundReason: null,
      refundRejectReason: null,
      tradeNo: '2026060222001',
      payableAmount: 29,
      goodsAmount: 24,
      deliveryFee: 5,
      cartItems: [
        {
          name: 'Rice Set',
          qty: 2,
        },
      ],
      totalQty: 2,
      paidAt: new Date('2026-06-02T10:00:00.000Z'),
      acceptedAt: null,
      preparingAt: null,
      deliveringAt: null,
      completedAt: null,
      canceledAt: null,
      refundRequestedAt: null,
      refundedAt: null,
      refundRejectedAt: null,
      createdAt: new Date('2026-06-02T09:55:00.000Z'),
      updatedAt: new Date('2026-06-02T10:00:00.000Z'),
      availableActions: ['ACCEPT'],
      customerAvailableActions: ['REQUEST_REFUND'],
      actionLogs,
    })
  })
})

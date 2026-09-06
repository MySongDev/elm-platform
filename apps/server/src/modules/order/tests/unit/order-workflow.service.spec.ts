import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { TenantAccessService } from '../tenant/tenant-access.service'
import { OrderWorkflowService } from './order-workflow.service'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNo: 'ELMDEMO202606020001',
    userId: '42',
    shopId: '1',
    shopName: '示例商家',
    tenantId: 10,
    status: 'PAID',
    tradeStatus: 'TRADE_SUCCESS',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
    goodsAmount: { toNumber: () => 24 },
    deliveryFee: { toNumber: () => 5 },
    payableAmount: { toNumber: () => 29 },
    cartItems: [{ qty: 2 }],
    paidAt: new Date('2026-06-02T10:00:00.000Z'),
    createdAt: new Date('2026-06-02T09:55:00.000Z'),
    updatedAt: new Date('2026-06-02T10:00:00.000Z'),
    actionLogs: [],
    ...overrides,
  }
}

function createService(orderOverrides: Record<string, unknown> = {}) {
  let currentOrder = createOrder(orderOverrides)
  const prisma = {
    $transaction: jest.fn(callback => callback(prisma)),
    paymentOrder: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(currentOrder)),
      update: jest.fn().mockImplementation(({ data }) => {
        currentOrder = {
          ...currentOrder,
          ...data,
          updatedAt: new Date('2026-06-02T10:05:00.000Z'),
        }
        return Promise.resolve(currentOrder)
      }),
    },
    orderActionLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as any

  const realTenantAccess = new TenantAccessService()
  const tenantAccess = {
    assertCanRead: jest.fn(context => realTenantAccess.assertCanRead(context)),
    assertCanWrite: jest.fn(context => realTenantAccess.assertCanWrite(context)),
  } as any

  return {
    service: new OrderWorkflowService(prisma, tenantAccess),
    prisma,
    tenantAccess,
    getCurrentOrder: () => currentOrder,
  }
}

const adminOperator = {
  operatorId: '1',
  operatorName: 'admin',
  operatorType: 'ADMIN' as const,
  requestId: 'req-admin-1',
}

const customerOperator = {
  operatorId: '42',
  operatorName: '测试用户',
  operatorType: 'CUSTOMER' as const,
  requestId: 'req-customer-1',
}

const tenantContext = {
  userId: 1,
  username: 'tenant-admin',
  tenantId: 10,
  tenantCode: 'flower-cake',
  tenantName: '鲜花蛋糕',
  tenantStatus: 'ACTIVE' as const,
  dataScope: 'TENANT' as const,
  boundShopIds: [],
  isPlatformAdmin: false,
}

describe('orderWorkflowService', () => {
  it('returns admin order detail with available actions and action logs', async () => {
    const { service, prisma } = createService()
    prisma.orderActionLog.findMany.mockResolvedValueOnce([{
      id: 1,
      action: 'ACCEPT',
    }])

    const result = await service.getAdminOrderDetail('ELMDEMO202606020001')

    expect(result.availableActions).toEqual(['ACCEPT'])
    expect(result.customerAvailableActions).toEqual(['REQUEST_REFUND'])
    expect(result.actionLogs).toEqual([{
      id: 1,
      action: 'ACCEPT',
    }])
  })

  it('throws when order detail does not exist', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique.mockResolvedValueOnce(null)

    await expect(service.getAdminOrderDetail('missing')).rejects.toThrow(NotFoundException)
  })

  it('accepts a paid awaiting order and writes an action log in the transaction', async () => {
    const { service, prisma } = createService()

    const result = await service.acceptOrder('ELMDEMO202606020001', adminOperator)

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: expect.objectContaining({
        fulfillmentStatus: 'ACCEPTED',
        acceptedAt: expect.any(Date),
      }),
    })
    expect(prisma.orderActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderNo: 'ELMDEMO202606020001',
        operatorId: '1',
        operatorName: 'admin',
        operatorType: 'ADMIN',
        action: 'ACCEPT',
        fromFulfillmentStatus: 'AWAITING_ACCEPTANCE',
        toFulfillmentStatus: 'ACCEPTED',
        fromRefundStatus: 'NONE',
        toRefundStatus: 'NONE',
        requestId: 'req-admin-1',
        tenantId: 10,
      }),
    })
    expect(result.fulfillmentStatus).toBe('ACCEPTED')
  })

  it('filters admin order detail by tenant context', async () => {
    const {
      service,
      prisma,
      tenantAccess,
    } = createService()

    await service.getAdminOrderDetail('ELMDEMO202606020001', tenantContext)

    expect(tenantAccess.assertCanRead).toHaveBeenCalled()
    expect(prisma.orderActionLog.findMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ELMDEMO202606020001',
        tenantId: 10,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  })

  it('hides admin order detail from other tenants', async () => {
    const { service } = createService({ tenantId: 20 })

    await expect(service.getAdminOrderDetail('ELMDEMO202606020001', tenantContext)).rejects.toThrow(NotFoundException)
  })

  it('filters admin fulfillment actions by tenant context', async () => {
    const { service, prisma } = createService()

    await service.acceptOrder('ELMDEMO202606020001', adminOperator, tenantContext)

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: expect.objectContaining({
        fulfillmentStatus: 'ACCEPTED',
      }),
    })
  })

  it('rejects admin fulfillment writes for read-only tenant statuses', async () => {
    const {
      service,
      prisma,
      tenantAccess,
    } = createService()

    await expect(service.acceptOrder('ELMDEMO202606020001', adminOperator, {
      ...tenantContext,
      tenantStatus: 'SUSPENDED',
    })).rejects.toThrow(ForbiddenException)

    expect(tenantAccess.assertCanWrite).toHaveBeenCalled()
    expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
  })

  it('rejects invalid fulfillment actions with conflict', async () => {
    const { service } = createService({ fulfillmentStatus: 'COMPLETED' })

    await expect(service.acceptOrder('ELMDEMO202606020001', adminOperator)).rejects.toThrow(ConflictException)
  })

  it('requests refund only for the order owner', async () => {
    const { service, prisma } = createService({ fulfillmentStatus: 'PREPARING' })

    const result = await service.requestRefund('ELMDEMO202606020001', {
      userId: '42',
      reason: '不想要了',
      operator: customerOperator,
    })

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: expect.objectContaining({
        refundStatus: 'REQUESTED',
        refundBaseFulfillmentStatus: 'PREPARING',
        refundReason: '不想要了',
        refundRequestedAt: expect.any(Date),
      }),
    })
    expect(result.refundStatus).toBe('REQUESTED')
  })

  it('rejects refund request from another customer', async () => {
    const { service } = createService()

    await expect(service.requestRefund('ELMDEMO202606020001', {
      userId: '99',
      reason: '不想要了',
      operator: customerOperator,
    })).rejects.toThrow(ForbiddenException)
  })

  it('approves requested refund and cancels fulfillment', async () => {
    const { service } = createService({
      fulfillmentStatus: 'PREPARING',
      refundStatus: 'REQUESTED',
    })

    const result = await service.approveRefund('ELMDEMO202606020001', adminOperator, '同意退款')

    expect(result.refundStatus).toBe('APPROVED')
    expect(result.fulfillmentStatus).toBe('CANCELED')
  })

  it('hides refund review actions from other tenants', async () => {
    const { service } = createService({
      tenantId: 20,
      fulfillmentStatus: 'PREPARING',
      refundStatus: 'REQUESTED',
    })

    await expect(service.approveRefund('ELMDEMO202606020001', adminOperator, '同意退款', tenantContext))
      .rejects
      .toThrow(NotFoundException)
  })

  it('rejects requested refund and keeps fulfillment status', async () => {
    const { service } = createService({
      fulfillmentStatus: 'PREPARING',
      refundStatus: 'REQUESTED',
      refundBaseFulfillmentStatus: 'PREPARING',
    })

    const result = await service.rejectRefund('ELMDEMO202606020001', adminOperator, '订单已开始制作')

    expect(result.refundStatus).toBe('REJECTED')
    expect(result.fulfillmentStatus).toBe('PREPARING')
    expect(result.refundRejectReason).toBe('订单已开始制作')
  })

  it('syncs paid payment status into awaiting acceptance once', async () => {
    const { service, prisma } = createService({
      fulfillmentStatus: 'PENDING_PAYMENT',
      status: 'PAID',
    })

    const result = await service.syncPaymentStatus(createOrder({
      fulfillmentStatus: 'PENDING_PAYMENT',
      status: 'PAID',
    }))

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: { fulfillmentStatus: 'AWAITING_ACCEPTANCE' },
    })
    expect(result.fulfillmentStatus).toBe('AWAITING_ACCEPTANCE')
  })

  it('syncs closed unpaid payment status into canceled fulfillment', async () => {
    const { service, prisma } = createService({
      fulfillmentStatus: 'PENDING_PAYMENT',
      status: 'CLOSED',
    })

    const result = await service.syncPaymentStatus(createOrder({
      fulfillmentStatus: 'PENDING_PAYMENT',
      status: 'CLOSED',
    }))

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMDEMO202606020001' },
      data: {
        fulfillmentStatus: 'CANCELED',
        canceledAt: expect.any(Date),
      },
    })
    expect(result.fulfillmentStatus).toBe('CANCELED')
  })
})

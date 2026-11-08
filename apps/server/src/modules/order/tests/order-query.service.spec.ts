import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { OrderQueryService } from '@/modules/order/order-query.service'
import { TenantAccessService } from '@/modules/tenant/tenant-access.service'

// 列表和详情测试来自原 PaymentService / OrderWorkflowService，随职责迁移，保留隔离断言。
describe('orderQueryService lists', () => {
  function createOrder(overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      orderNo: 'ELMALI202605231234560001',
      userId: '1',
      shopId: '101',
      shopName: '示例商家',
      status: 'PENDING',
      tradeStatus: 'WAIT_BUYER_PAY',
      fulfillmentStatus: 'PENDING_PAYMENT',
      refundStatus: 'NONE',
      refundBaseFulfillmentStatus: null,
      refundReason: null,
      refundRejectReason: null,
      tradeNo: null,
      subject: '示例商家 外卖订单',
      goodsAmount: { toNumber: () => 24 },
      deliveryFee: { toNumber: () => 5 },
      payableAmount: { toNumber: () => 29 },
      cartItems: [{
        itemId: '1001',
        skuId: '1001',
        title: '商品',
        qty: 2,
        unitPrice: 12,
        totalPrice: 24,
      }],
      notifyPayload: null,
      queryPayload: null,
      buyerPayAmount: null,
      paidAt: null,
      createdAt: new Date('2026-05-23T00:00:00.000Z'),
      updatedAt: new Date('2026-05-23T00:00:00.000Z'),
      ...overrides,
    }
  }

  function createService() {
    const order = createOrder()
    const prisma = {
      paymentOrder: { findMany: jest.fn().mockResolvedValue([order]) },
    } as any
    const realTenantAccess = new TenantAccessService()
    const tenantAccess = {
      assertCanRead: jest.fn(context => realTenantAccess.assertCanRead(context)),
      buildScopedWhere: jest.fn((context, query) => realTenantAccess.buildScopedWhere(context, query)),
    } as any
    return {
      service: new OrderQueryService(prisma, tenantAccess),
      prisma,
      tenantAccess,
    }
  }

  it('lists payment orders for admin with summary fields', async () => {
    const { service, prisma } = createService()

    const result = await service.listAdminOrders()

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: [{ paidAt: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    })
    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        orderNo: 'ELMALI202605231234560001',
        userId: '1',
        shopName: '示例商家',
        status: 'PENDING',
        tradeStatus: 'WAIT_BUYER_PAY',
        payableAmount: 29,
        goodsAmount: 24,
        deliveryFee: 5,
        totalQty: 2,
      }),
    ])
  })

  it('filters admin payment orders by tenant context', async () => {
    const {
      service,
      prisma,
      tenantAccess,
    } = createService()

    await service.listAdminOrders(undefined, {
      userId: 1,
      username: 'tenant-admin',
      tenantId: 10,
      tenantCode: 'flower-cake',
      tenantName: '鲜花蛋糕',
      tenantStatus: 'ACTIVE',
      dataScope: 'TENANT',
      boundShopIds: [],
      isPlatformAdmin: false,
    })

    expect(tenantAccess.assertCanRead).toHaveBeenCalled()
    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 10 },
    }))
  })

  it('rejects admin payment order filters for another tenant', async () => {
    const { service, prisma } = createService()

    await expect(service.listAdminOrders(undefined, {
      userId: 1,
      username: 'tenant-admin',
      tenantId: 10,
      tenantCode: 'flower-cake',
      tenantName: '鲜花蛋糕',
      tenantStatus: 'ACTIVE',
      dataScope: 'TENANT',
      boundShopIds: [],
      isPlatformAdmin: false,
    }, { tenantId: 20 })).rejects.toThrow(ForbiddenException)

    expect(prisma.paymentOrder.findMany).not.toHaveBeenCalled()
  })

  it('filters admin payment orders by bound shops for shop scoped operators', async () => {
    const { service, prisma } = createService()

    await service.listAdminOrders(undefined, {
      userId: 1,
      username: 'shop-operator',
      tenantId: 10,
      tenantCode: 'flower-cake',
      tenantName: '鲜花蛋糕',
      tenantStatus: 'ACTIVE',
      dataScope: 'SHOP',
      boundShopIds: ['1'],
      isPlatformAdmin: false,
    })

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tenantId: 10,
        shopId: { in: ['1'] },
      },
    }))
  })

  it('allows shop scoped operators to narrow admin orders to bound shops', async () => {
    const { service, prisma } = createService()

    await service.listAdminOrders(undefined, {
      userId: 1,
      username: 'shop-operator',
      tenantId: 10,
      tenantCode: 'flower-cake',
      tenantName: '鲜花蛋糕',
      tenantStatus: 'ACTIVE',
      dataScope: 'SHOP',
      boundShopIds: ['1'],
      isPlatformAdmin: false,
    }, { shopId: '1' })

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tenantId: 10,
        shopId: '1',
      },
    }))
  })
})

describe('orderQueryService details', () => {
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
    const prisma = {
      paymentOrder: { findUnique: jest.fn().mockResolvedValue(createOrder(orderOverrides)) },
      orderActionLog: { findMany: jest.fn().mockResolvedValue([]) },
    } as any
    const realTenantAccess = new TenantAccessService()
    const tenantAccess = {
      assertCanRead: jest.fn(context => realTenantAccess.assertCanRead(context)),
    } as any
    return {
      service: new OrderQueryService(prisma, tenantAccess),
      prisma,
      tenantAccess,
    }
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
})

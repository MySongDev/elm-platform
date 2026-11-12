import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { OrderWorkflowService } from '@/modules/order/order-workflow.service'
import { TenantAccessService } from '@/modules/tenant/tenant-access.service'

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
      create: jest.fn().mockImplementation(({ data }) => {
        const created = {
          ...createOrder(),
          ...data,
        }
        return Promise.resolve(created)
      }),
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
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 10 }),
    },
    // 租户解析改查 restaurants 表（见 resolveTenantIdByShopId）。
    // 默认返回 null（平台自营：商家存在但未绑定租户）。
    restaurant: {
      findUnique: jest.fn().mockResolvedValue({ tenantId: null }),
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

  it('rejects approving refund on a WeChat order so a paid order is never marked refunded without moving money', async () => {
    const { service, prisma } = createService({
      fulfillmentStatus: 'PREPARING',
      refundStatus: 'REQUESTED',
      paymentChannel: 'WECHAT',
    })

    await expect(service.approveRefund('ELMDEMO202606020001', adminOperator, '同意退款'))
      .rejects
      .toThrow(BadRequestException)

    // 关键：钱没动，也不能把订单写成 APPROVED / CANCELED
    expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
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

  describe('createOrder（渠道无关建单入口 POST /api/orders）', () => {
    const cartItems = [{
      itemId: '1001',
      qty: 2,
      skuId: '1001',
      title: '经典香辣鸡腿堡套餐',
      unitPrice: 12,
    }]

    it('creates a pending order without touching any payment channel', async () => {
      const { prisma, service } = createService()

      const result = await service.createOrder({
        cartItems,
        deliveryFee: 5,
        shopId: '2',
        shopName: '示例商家',
        userId: '42',
      })

      // 金额不变量：goodsAmount = 2 * 12 = 24，payableAmount = 24 + 5 = 29
      expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cartItems: expect.arrayContaining([
            expect.objectContaining({
              itemId: '1001',
              qty: 2,
              totalPrice: 24,
              unitPrice: 12,
            }),
          ]),
          deliveryFee: 5,
          goodsAmount: 24,
          orderNo: expect.stringMatching(/^ELMALI\d+$/),
          payableAmount: 29,
          shopId: '2',
          shopName: '示例商家',
          subject: '示例商家 外卖订单',
          userId: '42',
        }),
      })
      // 新订单必须落在 PENDING / 待支付 / 无退款 的初始状态上
      expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fulfillmentStatus: 'PENDING_PAYMENT',
          refundStatus: 'NONE',
          status: 'PENDING',
          tradeStatus: 'WAIT_BUYER_PAY',
        }),
      })
      // 返回订单摘要，不含 payUrl —— 建单不绑定支付渠道
      expect(result).not.toHaveProperty('payUrl')
      expect(result.status).toBe('PENDING')
      expect(result.payableAmount).toBe(29)
      expect(result.totalQty).toBe(2)
    })

    // 2026-09-30 商家数据本地化后重写：原实现按 shopId 去**内存 seed** 找 tenantCode，
    // 而上游 shop id 1 是"效果演示"（广州）、seed id 1 是"鲜花蛋糕旗舰店" —— id 撞车会把订单
    // 静默记到错误租户名下。现在改为查 `restaurants` 表。
    // 用例故意让 mock 返回非空 tenantId，才能证明这条接线是通的（而不是恒为 null 的巧合）。
    it('resolves the tenant from the restaurants table so order lists stay tenant scoped', async () => {
      const { prisma, service } = createService()
      prisma.restaurant.findUnique.mockResolvedValue({ tenantId: 77 })

      await service.createOrder({
        cartItems,
        deliveryFee: 0,
        shopId: '1',
        shopName: '鲜花蛋糕旗舰店',
        userId: '42',
      })

      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { tenantId: true },
      })
      expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tenantId: 77 }),
      })
    })

    it('records a null tenant while every shop is platform operated', async () => {
      const { prisma, service } = createService()

      await service.createOrder({
        cartItems,
        deliveryFee: 0,
        shopId: '101',
        shopName: '示例商家',
        userId: '42',
      })

      expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tenantId: null }),
      })
    })

    it('rejects anonymous order creation', async () => {
      const { prisma, service } = createService()

      await expect(service.createOrder({
        cartItems,
        deliveryFee: 0,
        userId: '',
      })).rejects.toThrow(UnauthorizedException)

      expect(prisma.paymentOrder.create).not.toHaveBeenCalled()
    })

    it('rejects empty carts and does not persist a zero amount order', async () => {
      const { prisma, service } = createService()

      await expect(service.createOrder({
        cartItems: [],
        deliveryFee: 0,
        userId: '42',
      })).rejects.toThrow(BadRequestException)

      expect(prisma.paymentOrder.create).not.toHaveBeenCalled()
    })

    it('treats a cart whose items all normalize away as empty', async () => {
      const { prisma, service } = createService()

      // qty <= 0 与缺 itemId 的项会被归一化过滤掉，等价于空购物车
      await expect(service.createOrder({
        cartItems: [
          {
            itemId: '',
            qty: 1,
            unitPrice: 12,
          },
          {
            itemId: '1001',
            qty: 0,
            unitPrice: 12,
          },
        ],
        deliveryFee: 0,
        userId: '42',
      })).rejects.toThrow(BadRequestException)

      expect(prisma.paymentOrder.create).not.toHaveBeenCalled()
    })
  })
})

import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PaymentService } from '@/modules/payment/payment.service'

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
    paymentOrder: {
      create: jest.fn().mockResolvedValue(order),
      findUnique: jest.fn().mockResolvedValue(order),
      findMany: jest.fn().mockResolvedValue([order]),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(createOrder(data))),
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

  const alipay = {
    hasConfig: jest.fn().mockReturnValue(true),
    createWapPayUrl: jest.fn().mockReturnValue('https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay'),
    queryTrade: jest.fn().mockResolvedValue({
      trade_status: 'TRADE_SUCCESS',
      trade_no: '2026052322001400000500000001',
      buyer_pay_amount: '29.00',
    }),
    verifyNotify: jest.fn().mockReturnValue(true),
    getAppId: jest.fn().mockReturnValue('app-id'),
    getSellerId: jest.fn().mockReturnValue('seller-id'),
  } as any

  const orderWorkflow = {
    syncPaymentStatus: jest.fn().mockImplementation(order => Promise.resolve(order)),
  } as any

  return {
    service: new PaymentService(prisma, alipay, orderWorkflow),
    prisma,
    alipay,
    orderWorkflow,
    order,
  }
}

describe('paymentService', () => {
  it('creates a persisted Alipay WAP payment order', async () => {
    const { service, prisma, alipay } = createService()

    const result = await service.createAlipayWapPayment({
      userId: '1',
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        skuId: '1001',
        title: '商品',
        qty: 2,
        unitPrice: 12,
      }],
    })

    expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: '1',
        shopId: '101',
        shopName: '示例商家',
        tenantId: null,
        subject: '示例商家 外卖订单',
        goodsAmount: 24,
        deliveryFee: 5,
        payableAmount: 29,
        status: 'PENDING',
        tradeStatus: 'WAIT_BUYER_PAY',
      }),
    })
    expect(alipay.createWapPayUrl).toHaveBeenCalledWith(expect.objectContaining({ payableAmount: 29 }))
    expect(result.payUrl).toContain('alipay.trade.wap.pay')
    expect(result.payableAmount).toBe(29)
  })

  it('rejects missing users', async () => {
    const { service } = createService()

    await expect(service.createAlipayWapPayment({
      userId: '',
      cartItems: [],
      deliveryFee: 0,
    } as any))
      .rejects
      .toThrow(UnauthorizedException)
  })

  it('rejects empty carts', async () => {
    const { service } = createService()

    await expect(service.createAlipayWapPayment({
      userId: '1',
      cartItems: [],
      deliveryFee: 0,
    }))
      .rejects
      .toThrow(BadRequestException)
  })

  it('refreshes status from Alipay when requested', async () => {
    const { service, prisma, alipay } = createService()

    const result = await service.getAlipayPaymentStatus('ELMALI202605231234560001', true)

    expect(alipay.queryTrade).toHaveBeenCalledWith('ELMALI202605231234560001')
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMALI202605231234560001' },
      data: expect.objectContaining({
        tradeNo: '2026052322001400000500000001',
        tradeStatus: 'TRADE_SUCCESS',
        status: 'PAID',
        buyerPayAmount: 29,
      }),
    })
    expect(result.status).toBe('PAID')
  })

  it('syncs fulfillment status after a paid payment status refresh', async () => {
    const { service, orderWorkflow } = createService()

    await service.getAlipayPaymentStatus('ELMALI202605231234560001', true)

    expect(orderWorkflow.syncPaymentStatus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'PAID',
      tradeStatus: 'TRADE_SUCCESS',
    }))
  })

  it('throws when the order does not exist', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique.mockResolvedValue(null)

    await expect(service.getAlipayPaymentStatus('missing', false)).rejects.toThrow(NotFoundException)
  })

  it('updates order from a valid notify payload', async () => {
    const { service, prisma } = createService()

    const result = await service.handleAlipayNotify({
      app_id: 'app-id',
      seller_id: 'seller-id',
      out_trade_no: 'ELMALI202605231234560001',
      trade_no: '2026052322001400000500000001',
      trade_status: 'TRADE_SUCCESS',
      total_amount: '29.00',
      gmt_payment: '2026-05-23 12:00:00',
    })

    expect(result).toBe(true)
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMALI202605231234560001' },
      data: expect.objectContaining({
        tradeStatus: 'TRADE_SUCCESS',
        status: 'PAID',
      }),
    })
  })

  // 2026-09-30 商家数据本地化后重写：原实现按 shopId 去**内存 seed** 找 tenantCode，
  // 而上游 shop id 1 是"效果演示"（广州）、seed id 1 是"鲜花蛋糕旗舰店" —— id 撞车会把订单
  // 静默记到错误租户名下。现在改为查 `restaurants` 表。
  // 用例故意让 mock 返回非空 tenantId，才能证明这条接线是通的（而不是恒为 null 的巧合）。
  it('resolves the tenant from the restaurants table when creating payment orders', async () => {
    const { service, prisma } = createService()
    prisma.restaurant.findUnique.mockResolvedValue({ tenantId: 77 })

    await service.createAlipayWapPayment({
      userId: '1',
      shopId: '1',
      shopName: '鲜花蛋糕旗舰店',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        skuId: '1001',
        title: '商品',
        qty: 2,
        unitPrice: 12,
      }],
    })

    expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { tenantId: true },
    })
    expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shopId: '1',
        tenantId: 77,
      }),
    })
  })

  it('records a null tenant while every shop is platform operated', async () => {
    const { service, prisma } = createService()

    await service.createAlipayWapPayment({
      userId: '1',
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        skuId: '1001',
        title: '商品',
        qty: 1,
        unitPrice: 12,
      }],
    })

    expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shopId: '101',
        tenantId: null,
      }),
    })
  })

  it('resumes a pending Alipay WAP payment with the original order number after refreshing status', async () => {
    const { service, prisma, alipay } = createService()

    alipay.queryTrade.mockResolvedValue({ trade_status: 'WAIT_BUYER_PAY' })
    prisma.paymentOrder.update.mockResolvedValue(createOrder())

    const result = await service.resumeAlipayWapPayment({
      orderNo: 'ELMALI202605231234560001',
      userId: '1',
    })

    expect(alipay.queryTrade).toHaveBeenCalledWith('ELMALI202605231234560001')
    expect(alipay.createWapPayUrl).toHaveBeenCalledWith({
      orderNo: 'ELMALI202605231234560001',
      payableAmount: 29,
      subject: '示例商家 外卖订单',
    })
    expect(result).toEqual({
      orderNo: 'ELMALI202605231234560001',
      payUrl: expect.stringContaining('alipay.trade.wap.pay'),
      payableAmount: 29,
    })
  })

  it('rejects status refresh when the order belongs to another user', async () => {
    const { service } = createService()

    await expect(service.getAlipayPaymentStatus('ELMALI202605231234560001', true, '2'))
      .rejects
      .toThrow(UnauthorizedException)
  })

  it('rejects resume when the order belongs to another user', async () => {
    const { service } = createService()

    await expect(service.resumeAlipayWapPayment({
      orderNo: 'ELMALI202605231234560001',
      userId: '2',
    })).rejects.toThrow(UnauthorizedException)
  })

  it('rejects resume when the Alipay status refresh fails', async () => {
    const { service, alipay } = createService()
    alipay.queryTrade.mockRejectedValue(new Error('network down'))

    await expect(service.resumeAlipayWapPayment({
      orderNo: 'ELMALI202605231234560001',
      userId: '1',
    })).rejects.toThrow(BadRequestException)
  })

  it('rejects resume when the order is paid', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({ status: 'PAID' }))

    await expect(service.resumeAlipayWapPayment({
      orderNo: 'ELMALI202605231234560001',
      userId: '1',
    })).rejects.toThrow(BadRequestException)
  })

  it('rejects resume when the order is closed', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({ status: 'CLOSED' }))

    await expect(service.resumeAlipayWapPayment({
      orderNo: 'ELMALI202605231234560001',
      userId: '1',
    })).rejects.toThrow(BadRequestException)
  })

  describe('微信渠道隔离：支付宝路径不得改写 WECHAT 订单', () => {
    it('getAlipayPaymentStatus(refresh) 对 WECHAT 订单只回本地摘要，不调支付宝查单、不改数据库', async () => {
      const { service, prisma, alipay } = createService()
      prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({ paymentChannel: 'WECHAT' }))

      const result = await service.getAlipayPaymentStatus('ELMALI202605231234560001', true)

      expect(alipay.queryTrade).not.toHaveBeenCalled()
      expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
      expect(result.status).toBe('PENDING')
    })

    it('resumeAlipayWapPayment 对 WECHAT 订单直接拒绝，不生成支付宝链接', async () => {
      const { service, prisma, alipay } = createService()
      prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({
        paymentChannel: 'WECHAT',
        status: 'PENDING',
      }))

      await expect(service.resumeAlipayWapPayment({
        orderNo: 'ELMALI202605231234560001',
        userId: '1',
      })).rejects.toThrow('微信支付')

      expect(alipay.createWapPayUrl).not.toHaveBeenCalled()
      expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
    })

    it('handleAlipayNotify 对 WECHAT 订单返回 false 且不写库，即便验签通过', async () => {
      const { service, prisma } = createService()
      prisma.paymentOrder.findUnique.mockResolvedValue(createOrder({ paymentChannel: 'WECHAT' }))
      // 故意让验签通过，证明拦截发生在渠道判断而非验签
      const result = await service.handleAlipayNotify({
        app_id: 'app-id',
        seller_id: 'seller-id',
        out_trade_no: 'ELMALI202605231234560001',
        trade_no: '2026052322001400000500000001',
        trade_status: 'TRADE_SUCCESS',
        total_amount: '29.00',
      })

      expect(result).toBe(false)
      expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
    })
  })
})

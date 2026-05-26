import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PaymentService } from './payment.service'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNo: 'ELMALI202605231234560001',
    userId: '1',
    shopId: '101',
    shopName: '示例商家',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
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

  return {
    service: new PaymentService(prisma, alipay),
    prisma,
    alipay,
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

  it('lists payment orders for admin with summary fields', async () => {
    const { service, prisma } = createService()

    const result = await service.listAdminOrders()

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith({
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
})

import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { WechatPaymentService } from './wechat-payment.service'

function createOrderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    orderNo: 'ELMALI202611120001',
    userId: '1',
    shopId: '1',
    shopName: '示例商家',
    status: 'PENDING',
    tradeStatus: 'WAIT_BUYER_PAY',
    paymentChannel: 'WECHAT',
    checkoutRequestKey: '["1","req-existing"]',
    fulfillmentStatus: 'PENDING_PAYMENT',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
    subject: '示例商家 外卖订单',
    goodsAmount: { toNumber: () => 24 },
    deliveryFee: { toNumber: () => 5 },
    payableAmount: { toNumber: () => 29 },
    cartItems: [{
      itemId: '11',
      skuId: '111',
      title: '商品',
      qty: 2,
      unitPrice: 12,
      totalPrice: 24,
    }],
    paidAt: null,
    createdAt: new Date('2026-11-12T00:00:00.000Z'),
    updatedAt: new Date('2026-11-12T00:00:00.000Z'),
    ...overrides,
  }
}

function pricedSelection() {
  return {
    shopId: '1',
    shopName: '示例商家',
    tenantId: 7,
    cartItems: [{
      itemId: '11',
      skuId: '111',
      qty: 2,
      title: '商品',
      unitPriceMinor: 1200,
      totalPriceMinor: 2400,
    }],
    goodsAmountMinor: 2400,
    deliveryFeeMinor: 500,
    payableAmountMinor: 2900,
  }
}

function createService(orderRecord: Record<string, unknown> = createOrderRecord()) {
  let current = orderRecord
  let updatedCount = 1
  const prisma = {
    paymentOrder: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.checkoutRequestKey !== undefined)
          return Promise.resolve(where.checkoutRequestKey === current.checkoutRequestKey ? current : null)
        if (where.orderNo !== undefined)
          return Promise.resolve(where.orderNo === current.orderNo ? current : null)
        return Promise.resolve(null)
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        current = {
          ...createOrderRecord(),
          ...data,
        }
        return Promise.resolve(current)
      }),
      update: jest.fn().mockImplementation(({ data }: any) => {
        current = {
          ...current,
          ...data,
        }
        return Promise.resolve(current)
      }),
      updateMany: jest.fn().mockImplementation(({ data }: any) => {
        if (updatedCount === 0)
          return Promise.resolve({ count: 0 })
        current = {
          ...current,
          ...data,
        }
        return Promise.resolve({ count: updatedCount })
      }),
    },
    $transaction: jest.fn().mockImplementation((fn: any) => fn(prisma)),
  } as any

  const pricing = {
    priceSelection: jest.fn().mockResolvedValue(pricedSelection()),
  } as any

  const wechat = {
    assertConfigured: jest.fn(),
    getIdentity: jest.fn().mockReturnValue({
      appId: 'wx-app',
      mchId: 'mch-1',
    }),
    exchangeOpenId: jest.fn().mockResolvedValue('openid-1'),
    createJsapiPayment: jest.fn().mockResolvedValue({
      timeStamp: '1794441600',
      nonceStr: 'nonce',
      package: 'prepay_id=wx1',
      signType: 'RSA',
      paySign: 'sign',
    }),
    queryTrade: jest.fn().mockResolvedValue(null),
    decodeNotification: jest.fn(),
  } as any

  return {
    service: new WechatPaymentService(prisma, pricing, wechat),
    prisma,
    pricing,
    wechat,
    setCurrent: (o: Record<string, unknown>) => { current = o },
    setUpdatedCount: (n: number) => { updatedCount = n },
    getCurrent: () => current,
  }
}

const cartItems = [{
  itemId: '11',
  skuId: '111',
  qty: 2,
}]

describe('wechatPaymentService 可信建单', () => {
  it('首次建单：服务端查价后按 WECHAT 渠道与 requestKey 落库，忽略客户端价格', async () => {
    const { service, prisma, pricing } = createService()

    const result = await service.createOrder({
      userId: '1',
      requestId: 'req-1',
      shopId: '1',
      cartItems,
    })

    expect(prisma.paymentOrder.findUnique).toHaveBeenCalledWith({
      where: { checkoutRequestKey: '["1","req-1"]' },
    })
    expect(pricing.priceSelection).toHaveBeenCalledWith({
      shopId: '1',
      cartItems,
    })
    expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: '1',
        shopId: '1',
        shopName: '示例商家',
        goodsAmount: 24,
        deliveryFee: 5,
        payableAmount: 29,
        paymentChannel: 'WECHAT',
        checkoutRequestKey: '["1","req-1"]',
        status: 'PENDING',
      }),
    })
    expect(result.payableAmount).toBe(29)
  })

  it('同一 requestKey + 相同选择重试：返回原单，不重复建单', async () => {
    const { service, prisma, pricing } = createService(createOrderRecord({ checkoutRequestKey: '["1","req-1"]' }))

    const result = await service.createOrder({
      userId: '1',
      requestId: 'req-1',
      shopId: '1',
      cartItems,
    })

    expect(pricing.priceSelection).not.toHaveBeenCalled()
    expect(prisma.paymentOrder.create).not.toHaveBeenCalled()
    expect(result.orderNo).toBe('ELMALI202611120001')
  })

  it('同一 requestKey + 不同选择：409，绝不复用原单少收钱', async () => {
    const { service } = createService(createOrderRecord({ checkoutRequestKey: '["1","req-1"]' }))

    await expect(service.createOrder({
      userId: '1',
      requestId: 'req-1',
      shopId: '1',
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 3,
      }],
    })).rejects.toThrow(ConflictException)
  })

  it('并发命中唯一约束 P2002 时回读原单，相同选择返回原单', async () => {
    const { service, prisma } = createService()
    prisma.paymentOrder.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createOrderRecord())
    prisma.paymentOrder.create.mockRejectedValueOnce({ code: 'P2002' })

    const result = await service.createOrder({
      userId: '1',
      requestId: 'req-1',
      shopId: '1',
      cartItems,
    })

    expect(result.orderNo).toBe('ELMALI202611120001')
  })

  it('未配置微信时不落无效订单', async () => {
    const { service, prisma, wechat, pricing } = createService()
    wechat.assertConfigured.mockImplementation(() => {
      throw new BadRequestException('未配置')
    })

    await expect(service.createOrder({
      userId: '1',
      requestId: 'req-2',
      shopId: '1',
      cartItems,
    })).rejects.toThrow(BadRequestException)

    expect(pricing.priceSelection).not.toHaveBeenCalled()
    expect(prisma.paymentOrder.create).not.toHaveBeenCalled()
  })

  it('匿名用户拒绝建单', async () => {
    const { service } = createService()
    await expect(service.createOrder({
      userId: '',
      requestId: 'req-1',
      shopId: '1',
      cartItems,
    })).rejects.toThrow(UnauthorizedException)
  })
})

describe('wechatPaymentService 预支付参数', () => {
  it('为 PENDING 的微信订单返回五参数，金额取服务端 payableAmount', async () => {
    const { service, wechat } = createService()

    const result = await service.createPaymentParams({
      userId: '1',
      orderNo: 'ELMALI202611120001',
      code: 'wx-code',
    })

    expect(wechat.exchangeOpenId).toHaveBeenCalledWith('wx-code')
    expect(wechat.createJsapiPayment).toHaveBeenCalledWith({
      orderNo: 'ELMALI202611120001',
      subject: '示例商家 外卖订单',
      total: 2900,
    }, 'openid-1')
    expect(result.paymentParams.signType).toBe('RSA')
    expect(result.payableAmount).toBe(29)
  })

  it('拒绝他人的订单', async () => {
    const { service } = createService()
    await expect(service.createPaymentParams({
      userId: '2',
      orderNo: 'ELMALI202611120001',
      code: 'wx-code',
    })).rejects.toThrow(UnauthorizedException)
  })

  it('拒绝非微信渠道订单', async () => {
    const { service } = createService(createOrderRecord({ paymentChannel: 'ALIPAY' }))
    await expect(service.createPaymentParams({
      userId: '1',
      orderNo: 'ELMALI202611120001',
      code: 'wx-code',
    })).rejects.toThrow(BadRequestException)
  })

  it('已支付订单拒绝再次预支付', async () => {
    const { service } = createService(createOrderRecord({ status: 'PAID' }))
    await expect(service.createPaymentParams({
      userId: '1',
      orderNo: 'ELMALI202611120001',
      code: 'wx-code',
    })).rejects.toThrow(BadRequestException)
  })

  it('订单不存在返回 404', async () => {
    const { service } = createService(createOrderRecord({ orderNo: 'OTHER' }))
    await expect(service.createPaymentParams({
      userId: '1',
      orderNo: 'ELMALI202611120001',
      code: 'wx-code',
    })).rejects.toThrow(NotFoundException)
  })
})

function successTransaction(overrides: Record<string, unknown> = {}) {
  return {
    appid: 'wx-app',
    mchid: 'mch-1',
    out_trade_no: 'ELMALI202611120001',
    transaction_id: '4200001',
    trade_state: 'SUCCESS',
    success_time: '2026-11-12T01:02:03+08:00',
    amount: {
      total: 2900,
      currency: 'CNY',
      payer_total: 2900,
    },
    ...overrides,
  }
}

describe('wechatPaymentService 到账结算', () => {
  it('通知验签通过且金额一致：条件更新写 PAID 并同步履约状态', async () => {
    const { service, prisma, wechat } = createService()
    wechat.decodeNotification.mockReturnValue(successTransaction())

    const ok = await service.handleNotification({}, Buffer.from('{}'))

    expect(ok).toBe(true)
    expect(prisma.paymentOrder.updateMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ELMALI202611120001',
        status: 'PENDING',
      },
      data: expect.objectContaining({
        status: 'PAID',
        tradeStatus: 'SUCCESS',
        tradeNo: '4200001',
      }),
    })
    // 履约状态必须在同一个事务里推进，否则崩溃会留下「已付款但待支付」的订单。
    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { orderNo: 'ELMALI202611120001' },
      data: { fulfillmentStatus: 'AWAITING_ACCEPTANCE' },
    })
  })

  it('验签失败不查库也不改单，回失败让微信重推', async () => {
    const { service, prisma, wechat } = createService()
    wechat.decodeNotification.mockImplementation(() => {
      throw new BadRequestException('验签失败')
    })

    const ok = await service.handleNotification({}, Buffer.from('{}'))

    expect(ok).toBe(false)
    expect(prisma.paymentOrder.findUnique).not.toHaveBeenCalled()
    expect(prisma.paymentOrder.updateMany).not.toHaveBeenCalled()
  })

  it('金额与应付不一致：拒绝入账', async () => {
    const { service, prisma, wechat } = createService()
    wechat.decodeNotification.mockReturnValue(successTransaction({
      amount: {
        total: 1,
        currency: 'CNY',
      },
    }))

    const ok = await service.handleNotification({}, Buffer.from('{}'))

    expect(ok).toBe(false)
    expect(prisma.paymentOrder.updateMany).not.toHaveBeenCalled()
  })

  it('商户号不属于当前商户：拒绝入账', async () => {
    const { service, prisma, wechat } = createService()
    wechat.decodeNotification.mockReturnValue(successTransaction({ mchid: 'other-mch' }))

    const ok = await service.handleNotification({}, Buffer.from('{}'))

    expect(ok).toBe(false)
    expect(prisma.paymentOrder.updateMany).not.toHaveBeenCalled()
  })

  it('重复通知：条件更新命中 0 行但订单已是 PAID 时，仍回成功不再入账', async () => {
    const { service, prisma, wechat } = createService(createOrderRecord({ status: 'PAID' }))
    wechat.decodeNotification.mockReturnValue(successTransaction())
    ;(prisma.paymentOrder.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

    const ok = await service.handleNotification({}, Buffer.from('{}'))

    expect(ok).toBe(true)
    // 已经入账的单不该再写任何字段（包括履约状态）。
    expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
  })

  it('已关闭订单收到成功通知：不改状态且回失败，留给人工对账', async () => {
    const { service, prisma, wechat } = createService(createOrderRecord({ status: 'CLOSED' }))
    wechat.decodeNotification.mockReturnValue(successTransaction())
    ;(prisma.paymentOrder.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

    const ok = await service.handleNotification({}, Buffer.from('{}'))

    expect(ok).toBe(false)
    expect(service).toBeDefined()
  })

  it('主动查单未支付：只记 tradeStatus，不把订单判为已支付', async () => {
    const { service, prisma, wechat } = createService()
    wechat.queryTrade.mockResolvedValue(successTransaction({
      trade_state: 'NOTPAY',
      transaction_id: undefined,
      success_time: undefined,
      amount: undefined,
    }))

    await service.refreshOrderStatus({
      userId: '1',
      orderNo: 'ELMALI202611120001',
    })

    expect(prisma.paymentOrder.updateMany).toHaveBeenCalledTimes(1)
    expect(prisma.paymentOrder.updateMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ELMALI202611120001',
        status: 'PENDING',
      },
      data: {
        tradeStatus: 'NOTPAY',
        queryPayload: expect.any(Object),
      },
    })
  })

  it('微信确认关闭：条件更新本地关闭并结束待支付履约，不再允许续付', async () => {
    const { service, prisma, wechat } = createService()
    wechat.queryTrade.mockResolvedValue({
      appid: 'wx-app',
      mchid: 'mch-1',
      out_trade_no: 'ELMALI202611120001',
      trade_state: 'CLOSED',
    })

    const result = await service.refreshOrderStatus({
      userId: '1',
      orderNo: 'ELMALI202611120001',
    })

    expect(result.status).toBe('CLOSED')
    expect(prisma.paymentOrder.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        orderNo: 'ELMALI202611120001',
        status: 'PENDING',
      },
      data: expect.objectContaining({
        status: 'CLOSED',
        tradeStatus: 'CLOSED',
      }),
    })
    expect(prisma.paymentOrder.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        orderNo: 'ELMALI202611120001',
        fulfillmentStatus: 'PENDING_PAYMENT',
      },
      data: expect.objectContaining({ fulfillmentStatus: 'CANCELED' }),
    })
    await expect(service.createPaymentParams({
      userId: '1',
      orderNo: 'ELMALI202611120001',
      code: 'wx-code',
    })).rejects.toThrow(BadRequestException)
    expect(wechat.createJsapiPayment).not.toHaveBeenCalled()
  })

  it('迟到的 CLOSED 查询不能覆盖已入账订单', async () => {
    const { service, prisma, wechat } = createService(createOrderRecord({
      status: 'PAID',
      tradeStatus: 'SUCCESS',
    }))
    prisma.paymentOrder.updateMany.mockResolvedValue({ count: 0 })
    prisma.paymentOrder.findUnique.mockResolvedValue(createOrderRecord({
      status: 'PAID',
      tradeStatus: 'SUCCESS',
    }))
    wechat.queryTrade.mockResolvedValue({
      appid: 'wx-app',
      mchid: 'mch-1',
      out_trade_no: 'ELMALI202611120001',
      trade_state: 'CLOSED',
    })

    const result = await service.refreshOrderStatus({
      userId: '1',
      orderNo: 'ELMALI202611120001',
    })

    expect(result.status).toBe('PAID')
    expect(result.tradeStatus).toBe('SUCCESS')
    expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
  })

  it('主动查单成功：与通知走同一条入账路径', async () => {
    const { service, prisma, wechat } = createService()
    wechat.queryTrade.mockResolvedValue(successTransaction())

    const result = await service.refreshOrderStatus({
      userId: '1',
      orderNo: 'ELMALI202611120001',
    })

    expect(prisma.paymentOrder.updateMany).toHaveBeenCalledWith({
      where: {
        orderNo: 'ELMALI202611120001',
        status: 'PENDING',
      },
      data: expect.objectContaining({
        status: 'PAID',
        queryPayload: expect.any(Object),
      }),
    })
    expect(result.status).toBe('PAID')
  })

  it('主动查单返回 null（微信侧无此单）：不改本地任何状态', async () => {
    const { service, prisma, wechat } = createService()
    wechat.queryTrade.mockResolvedValue(null)

    await service.refreshOrderStatus({
      userId: '1',
      orderNo: 'ELMALI202611120001',
    })

    expect(prisma.paymentOrder.update).not.toHaveBeenCalled()
    expect(prisma.paymentOrder.updateMany).not.toHaveBeenCalled()
  })

  it('refresh=0 只回本地快照，不访问微信', async () => {
    const { service, wechat } = createService()

    const result = await service.getOrderStatus({
      userId: '1',
      orderNo: 'ELMALI202611120001',
    })

    expect(wechat.queryTrade).not.toHaveBeenCalled()
    expect(result.orderNo).toBe('ELMALI202611120001')
  })

  it('查单拒绝他人订单', async () => {
    const { service } = createService()
    await expect(service.getOrderStatus({
      userId: '2',
      orderNo: 'ELMALI202611120001',
    })).rejects.toThrow(UnauthorizedException)
  })
})

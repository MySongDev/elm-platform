import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const paymentClient = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }

  return {
    getStore: vi.fn(),
    paymentClient,
  }
})

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mocks.paymentClient),
    isAxiosError: vi.fn(() => false),
  },
}))

vi.mock('@/utils/storage/storage', () => ({
  getStore: mocks.getStore,
}))

const {
  createAlipayWapPayment,
  getUserPaymentOrders,
  requestOrderRefund,
  resumeAlipayWapPayment,
} = await import('./api-payment')

describe('api-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates payments without requiring client-owned userId in the payload', async () => {
    mocks.paymentClient.post.mockResolvedValueOnce({
      data: {
        orderNo: 'ELMALI202605241200000001',
        payUrl: 'https://example.com/pay',
        payableAmount: 29,
      },
    })

    await createAlipayWapPayment({
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    })

    expect(mocks.paymentClient.post).toHaveBeenCalledWith('/payments/alipay/wap/create', {
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    })
  })

  it('resumes payments by order number only', async () => {
    mocks.paymentClient.post.mockResolvedValueOnce({
      data: {
        orderNo: 'ELMALI202605241200000001',
        payUrl: 'https://example.com/pay',
        payableAmount: 29,
      },
    })

    await resumeAlipayWapPayment({
      orderNo: 'ELMALI202605241200000001',
    })

    expect(mocks.paymentClient.post).toHaveBeenCalledWith('/payments/alipay/wap/resume', {
      orderNo: 'ELMALI202605241200000001',
    })
  })

  it('lists authenticated user payment orders without sending a userId query', async () => {
    mocks.paymentClient.get.mockResolvedValueOnce({
      data: {
        orders: [],
      },
    })

    await getUserPaymentOrders(20)

    expect(mocks.paymentClient.get).toHaveBeenCalledWith('/orders', {
      params: {
        limit: 20,
      },
    })
  })

  it('requests order refund by order number and reason', async () => {
    mocks.paymentClient.post.mockResolvedValueOnce({
      data: {
        orderNo: 'ELMALI202605241200000001',
        refundStatus: 'REQUESTED',
      },
    })

    await requestOrderRefund({
      orderNo: 'ELMALI202605241200000001',
      reason: '不想要了',
    })

    expect(mocks.paymentClient.post).toHaveBeenCalledWith('/orders/ELMALI202605241200000001/refund/request', {
      reason: '不想要了',
    })
  })
})

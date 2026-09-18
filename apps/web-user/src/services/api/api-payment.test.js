import { beforeEach, describe, expect, it, vi } from 'vitest'

// 支付 API 现走全局 http（get/post），mock 边界随之从 axios 上移到 @/services/http/http。
// 全局 get/post 已在响应拦截器里 unwrap 为 response.data，所以这里直接 resolve 裸载荷。
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/services/http/http', () => ({
  get: mocks.get,
  post: mocks.post,
}))

const {
  createAlipayWapPayment,
  getUserPaymentOrders,
  requestOrderRefund,
  resumeAlipayWapPayment,
} = await import('./api-payment')

// 支付请求统一附带的全局副作用开关：关全局 loading + 静默全局错误弹窗
const PAYMENT_OPTIONS = {
  loading: false,
  meta: { silent: true },
}

describe('api-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates payments without requiring client-owned userId in the payload', async () => {
    mocks.post.mockResolvedValueOnce({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://example.com/pay',
      payableAmount: 29,
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

    expect(mocks.post).toHaveBeenCalledWith('/payments/alipay/wap/create', {
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    }, PAYMENT_OPTIONS)
  })

  it('resumes payments by order number only', async () => {
    mocks.post.mockResolvedValueOnce({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://example.com/pay',
      payableAmount: 29,
    })

    await resumeAlipayWapPayment({
      orderNo: 'ELMALI202605241200000001',
    })

    expect(mocks.post).toHaveBeenCalledWith('/payments/alipay/wap/resume', {
      orderNo: 'ELMALI202605241200000001',
    }, PAYMENT_OPTIONS)
  })

  it('lists authenticated user payment orders without sending a userId query', async () => {
    mocks.get.mockResolvedValueOnce({
      orders: [],
    })

    await getUserPaymentOrders(20)

    expect(mocks.get).toHaveBeenCalledWith('/orders', {
      limit: 20,
    }, PAYMENT_OPTIONS)
  })

  it('requests order refund by order number and reason', async () => {
    mocks.post.mockResolvedValueOnce({
      orderNo: 'ELMALI202605241200000001',
      refundStatus: 'REQUESTED',
    })

    await requestOrderRefund({
      orderNo: 'ELMALI202605241200000001',
      reason: '不想要了',
    })

    expect(mocks.post).toHaveBeenCalledWith('/orders/ELMALI202605241200000001/refund/request', {
      reason: '不想要了',
    }, PAYMENT_OPTIONS)
  })
})

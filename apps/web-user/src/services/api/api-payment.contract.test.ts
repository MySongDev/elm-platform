import type { paths } from '@elm-platform/api-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type ResumePaymentRequest
  = paths['/api/payments/alipay/wap/resume']['post']['requestBody']['content']['application/json']
type ResumePaymentResponse
  = paths['/api/payments/alipay/wap/resume']['post']['responses'][200]['content']['application/json']

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

const { resumeAlipayWapPayment } = await import('./api-payment')

describe('payment resume API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts only the order number and consumes the generated raw resume response shape', async () => {
    const request = {
      orderNo: 'ELMALI202605241200000001',
    } satisfies ResumePaymentRequest
    const response = {
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://example.com/pay',
      payableAmount: 29,
    } satisfies ResumePaymentResponse

    mocks.paymentClient.post.mockResolvedValueOnce({ data: response })

    const result = await resumeAlipayWapPayment(request)

    expect(mocks.paymentClient.post).toHaveBeenCalledWith('/payments/alipay/wap/resume', request)
    expect(result).toBe(response)
    expect(result.payUrl).toBe('https://example.com/pay')
  })
})

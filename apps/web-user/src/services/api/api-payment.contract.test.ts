import type { paths } from '@elm-platform/api-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type ResumePaymentRequest
  = paths['/api/payments/alipay/wap/resume']['post']['requestBody']['content']['application/json']
type ResumePaymentResponse
  = paths['/api/payments/alipay/wap/resume']['post']['responses'][200]['content']['application/json']

// 支付 API 走全局 http（get/post），全局响应拦截器已 unwrap 为 response.data，
// 故 mock post 直接 resolve 裸载荷。
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/services/http/http', () => ({
  get: mocks.get,
  post: mocks.post,
}))

const { resumeAlipayWapPayment } = await import('./api-payment')

const PAYMENT_OPTIONS = {
  loading: false,
  meta: { silent: true },
}

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

    mocks.post.mockResolvedValueOnce(response)

    const result = await resumeAlipayWapPayment(request)

    expect(mocks.post).toHaveBeenCalledWith('/payments/alipay/wap/resume', request, PAYMENT_OPTIONS)
    expect(result).toBe(response)
    expect(result.payUrl).toBe('https://example.com/pay')
  })
})

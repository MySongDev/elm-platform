import { beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { showAlert } from '@/components/common/AlterTip'
import { getAlipayPaymentStatus, resumeAlipayWapPayment } from '@/services/api/api-payment'
import { useContinuePayment } from './useContinuePayment'

vi.mock('@/components/common/AlterTip', () => ({
  showAlert: vi.fn(),
}))

vi.mock('@/services/api/api-payment', () => ({
  getAlipayPaymentStatus: vi.fn(),
  resumeAlipayWapPayment: vi.fn(),
}))

describe('useContinuePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refreshes a pending order, resumes it by order number, and redirects to Alipay', async () => {
    const redirectToPayUrl = vi.fn()
    const fetchOrders = vi.fn()

    vi.mocked(getAlipayPaymentStatus).mockResolvedValueOnce({
      orderNo: 'ELMALI202605241200000001',
      status: 'PENDING',
    })
    vi.mocked(resumeAlipayWapPayment).mockResolvedValueOnce({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://example.com/pay',
    })

    const { continuePayment } = useContinuePayment({
      currentUserId: shallowRef('42'),
      fetchOrders,
      goLogin: vi.fn(),
      redirectToPayUrl,
    })

    await continuePayment({
      orderNo: 'ELMALI202605241200000001',
    })

    expect(getAlipayPaymentStatus).toHaveBeenCalledWith('ELMALI202605241200000001', true)
    expect(resumeAlipayWapPayment).toHaveBeenCalledWith({
      orderNo: 'ELMALI202605241200000001',
    })
    expect(redirectToPayUrl).toHaveBeenCalledWith('https://example.com/pay')
    expect(fetchOrders).not.toHaveBeenCalled()
  })

  it('does not resume paid orders after status refresh', async () => {
    const fetchOrders = vi.fn()

    vi.mocked(getAlipayPaymentStatus).mockResolvedValueOnce({
      orderNo: 'ELMALI202605241200000001',
      status: 'PAID',
    })

    const { continuePayment } = useContinuePayment({
      currentUserId: shallowRef('42'),
      fetchOrders,
      goLogin: vi.fn(),
      redirectToPayUrl: vi.fn(),
    })

    await continuePayment({
      orderNo: 'ELMALI202605241200000001',
    })

    expect(showAlert).toHaveBeenCalledWith('订单已支付')
    expect(fetchOrders).toHaveBeenCalledTimes(1)
    expect(resumeAlipayWapPayment).not.toHaveBeenCalled()
  })

  it('sends unauthenticated users to login before touching payment APIs', async () => {
    const goLogin = vi.fn()
    const { continuePayment } = useContinuePayment({
      currentUserId: shallowRef(''),
      fetchOrders: vi.fn(),
      goLogin,
      redirectToPayUrl: vi.fn(),
    })

    await continuePayment({
      orderNo: 'ELMALI202605241200000001',
    })

    expect(goLogin).toHaveBeenCalledTimes(1)
    expect(getAlipayPaymentStatus).not.toHaveBeenCalled()
    expect(resumeAlipayWapPayment).not.toHaveBeenCalled()
  })
})

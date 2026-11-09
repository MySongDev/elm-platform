import type { AdminOrderDetailResult } from './index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'
import { getCommerceOrderDetail } from './index'

vi.mock('@/shared/api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('admin order detail API contract', () => {
  beforeEach(() => {
    vi.mocked(request.get).mockReset()
  })

  it('consumes the generated order detail response data shape', async () => {
    const orderDetail = {
      id: 1,
      orderNo: 'ELMDEMO202606020001',
      userId: '42',
      shopId: '1',
      shopName: 'Demo Shop',
      status: 'PAID',
      tradeStatus: 'TRADE_SUCCESS',
      fulfillmentStatus: 'AWAITING_ACCEPTANCE',
      refundStatus: 'NONE',
      refundBaseFulfillmentStatus: null,
      refundReason: null,
      refundRejectReason: null,
      tradeNo: '2026060222001',
      payableAmount: 29,
      goodsAmount: 24,
      deliveryFee: 5,
      cartItems: [
        {
          name: 'Rice Set',
          qty: 2,
        },
      ],
      totalQty: 2,
      paidAt: '2026-06-02T10:00:00.000Z',
      acceptedAt: null,
      preparingAt: null,
      deliveringAt: null,
      completedAt: null,
      canceledAt: null,
      refundRequestedAt: null,
      refundedAt: null,
      refundRejectedAt: null,
      createdAt: '2026-06-02T09:55:00.000Z',
      updatedAt: '2026-06-02T10:00:00.000Z',
      availableActions: ['ACCEPT'],
      customerAvailableActions: ['REQUEST_REFUND'],
      actionLogs: [{
        id: 1,
        orderNo: 'ELMDEMO202606020001',
        operatorId: '1',
        operatorName: 'admin',
        operatorType: 'ADMIN',
        action: 'ACCEPT',
        fromFulfillmentStatus: 'AWAITING_ACCEPTANCE',
        toFulfillmentStatus: 'ACCEPTED',
        fromRefundStatus: 'NONE',
        toRefundStatus: 'NONE',
        reason: null,
        remark: null,
        requestId: 'req-admin-1',
        createdAt: '2026-06-02T10:01:00.000Z',
      }],
    } satisfies AdminOrderDetailResult

    vi.mocked(request.get).mockResolvedValueOnce(orderDetail)

    const result = await getCommerceOrderDetail('ELMDEMO202606020001')

    expect(request.get).toHaveBeenCalledWith(adminEndpoints.commerce.orderDetail('ELMDEMO202606020001'))
    expect(result).toBe(orderDetail)
    expect(result.actionLogs[0]).toMatchObject({
      action: 'ACCEPT',
      requestId: 'req-admin-1',
    })
  })
})

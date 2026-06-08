import type { OrderItem } from '@/entities/order'
import { describe, expect, it } from 'vitest'
import { getVisibleOrderActions } from './workflow'

function createOrder(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 1,
    orderNo: 'ELMDEMO202606020001',
    userId: '42',
    shopId: '1',
    shopName: '示例商家',
    status: 'PAID',
    tradeStatus: 'TRADE_SUCCESS',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    refundBaseFulfillmentStatus: null,
    refundReason: null,
    refundRejectReason: null,
    tradeNo: null,
    payableAmount: 29,
    goodsAmount: 24,
    deliveryFee: 5,
    cartItems: [],
    totalQty: 2,
    paidAt: null,
    acceptedAt: null,
    preparingAt: null,
    deliveringAt: null,
    completedAt: null,
    canceledAt: null,
    refundRequestedAt: null,
    refundedAt: null,
    refundRejectedAt: null,
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
    availableActions: ['ACCEPT'],
    customerAvailableActions: [],
    ...overrides,
  }
}

describe('order workflow config', () => {
  it('shows only backend-provided actions that the current user can perform', () => {
    const order = createOrder({ availableActions: ['ACCEPT', 'APPROVE_REFUND'] })
    const visible = getVisibleOrderActions(order, permission => permission === 'commerce:order:accept')

    expect(visible.map(item => item.action)).toEqual(['ACCEPT'])
  })

  it('does not show actions when backend returns none', () => {
    const order = createOrder({ availableActions: [] })

    expect(getVisibleOrderActions(order, () => true)).toEqual([])
  })
})

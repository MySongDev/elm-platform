import { ConflictException } from '@nestjs/common'
import {
  assertAdminActionAllowed,
  assertRefundRequestAllowed,
  assertRefundReviewAllowed,
  getAdminAvailableActions,
  getCustomerAvailableActions,
  getNextFulfillmentStatus,
  normalizeFulfillmentStatus,
  normalizeRefundStatus,
} from './order-transition.policy'

function createOrder(overrides: Record<string, unknown> = {}) {
  return {
    status: 'PAID',
    fulfillmentStatus: 'AWAITING_ACCEPTANCE',
    refundStatus: 'NONE',
    ...overrides,
  }
}

describe('orderTransitionPolicy', () => {
  it('normalizes missing workflow fields from payment status', () => {
    expect(normalizeFulfillmentStatus(createOrder({
      fulfillmentStatus: null,
      status: 'PENDING',
    }))).toBe('PENDING_PAYMENT')
    expect(normalizeFulfillmentStatus(createOrder({
      fulfillmentStatus: null,
      status: 'PAID',
    }))).toBe('AWAITING_ACCEPTANCE')
    expect(normalizeRefundStatus(createOrder({ refundStatus: null }))).toBe('NONE')
  })

  it('returns admin actions from the current fulfillment status', () => {
    expect(getAdminAvailableActions(createOrder())).toEqual(['ACCEPT'])
    expect(getAdminAvailableActions(createOrder({ fulfillmentStatus: 'ACCEPTED' }))).toEqual(['START_PREPARING'])
    expect(getAdminAvailableActions(createOrder({ fulfillmentStatus: 'PREPARING' }))).toEqual(['START_DELIVERY'])
    expect(getAdminAvailableActions(createOrder({ fulfillmentStatus: 'DELIVERING' }))).toEqual(['COMPLETE'])
  })

  it('returns refund review actions only when refund is requested', () => {
    const order = createOrder({
      fulfillmentStatus: 'PREPARING',
      refundStatus: 'REQUESTED',
    })

    expect(getAdminAvailableActions(order)).toEqual(['START_DELIVERY', 'APPROVE_REFUND', 'REJECT_REFUND'])
  })

  it('returns customer refund action only for paid active orders without an existing refund', () => {
    expect(getCustomerAvailableActions(createOrder())).toEqual(['REQUEST_REFUND'])
    expect(getCustomerAvailableActions(createOrder({ status: 'PENDING' }))).toEqual([])
    expect(getCustomerAvailableActions(createOrder({ fulfillmentStatus: 'COMPLETED' }))).toEqual([])
    expect(getCustomerAvailableActions(createOrder({ refundStatus: 'REQUESTED' }))).toEqual([])
  })

  it('calculates the next fulfillment status for valid admin actions', () => {
    expect(getNextFulfillmentStatus(createOrder(), 'ACCEPT')).toBe('ACCEPTED')
    expect(getNextFulfillmentStatus(createOrder({ fulfillmentStatus: 'ACCEPTED' }), 'START_PREPARING')).toBe('PREPARING')
    expect(getNextFulfillmentStatus(createOrder({ fulfillmentStatus: 'PREPARING' }), 'START_DELIVERY')).toBe('DELIVERING')
    expect(getNextFulfillmentStatus(createOrder({ fulfillmentStatus: 'DELIVERING' }), 'COMPLETE')).toBe('COMPLETED')
  })

  it('rejects invalid fulfillment transitions with conflict errors', () => {
    expect(() => assertAdminActionAllowed(createOrder(), 'COMPLETE')).toThrow(ConflictException)
    expect(() => assertAdminActionAllowed(createOrder({ status: 'PENDING' }), 'ACCEPT')).toThrow(ConflictException)
  })

  it('rejects invalid refund requests with conflict errors', () => {
    expect(() => assertRefundRequestAllowed(createOrder())).not.toThrow()
    expect(() => assertRefundRequestAllowed(createOrder({ refundStatus: 'REQUESTED' }))).toThrow(ConflictException)
    expect(() => assertRefundRequestAllowed(createOrder({ fulfillmentStatus: 'COMPLETED' }))).toThrow(ConflictException)
  })

  it('rejects refund review when the refund is not requested', () => {
    expect(() => assertRefundReviewAllowed(createOrder({ refundStatus: 'REQUESTED' }))).not.toThrow()
    expect(() => assertRefundReviewAllowed(createOrder({ refundStatus: 'APPROVED' }))).toThrow(ConflictException)
    expect(() => assertRefundReviewAllowed(createOrder({ refundStatus: 'NONE' }))).toThrow(ConflictException)
  })
})

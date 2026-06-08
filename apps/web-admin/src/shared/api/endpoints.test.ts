import { describe, expect, it } from 'vitest'
import { adminEndpoints } from './endpoints'

describe('admin commerce endpoints', () => {
  it('exposes the order fulfillment and refund approval endpoints', () => {
    expect(adminEndpoints.commerce.orders).toBe('/admin/commerce/orders')
    expect(adminEndpoints.commerce.orderDetail('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1')
    expect(adminEndpoints.commerce.orderAccept('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1/accept')
    expect(adminEndpoints.commerce.orderStartPreparing('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1/start-preparing')
    expect(adminEndpoints.commerce.orderStartDelivery('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1/start-delivery')
    expect(adminEndpoints.commerce.orderComplete('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1/complete')
    expect(adminEndpoints.commerce.orderRefundApprove('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1/refund/approve')
    expect(adminEndpoints.commerce.orderRefundReject('ORDER-1')).toBe('/admin/commerce/orders/ORDER-1/refund/reject')
  })
})

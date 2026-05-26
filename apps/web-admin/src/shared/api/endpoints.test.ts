import { describe, expect, it } from 'vitest'
import { adminEndpoints } from './endpoints'

describe('admin commerce endpoints', () => {
  it('exposes the readonly real payment order list without the old order status edit detail endpoint', () => {
    expect(adminEndpoints.commerce.orders).toBe('/admin/commerce/orders')
    expect('orderDetail' in adminEndpoints.commerce).toBe(false)
  })
})

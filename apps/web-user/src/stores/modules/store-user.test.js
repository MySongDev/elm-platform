import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useUserStore } from './store-user'

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('normalizes backend numeric user ids to strings', () => {
    const store = useUserStore()

    store.recordUserInfo({
      user_id: 80251,
      username: 'song',
      avatar: 'default.jpg',
    })

    expect(store.userId).toBe('80251')
    expect(store.userInfo.user_id).toBe('80251')
    expect(localStorage.getItem('user_id')).toBe('80251')
  })

  it('stores customer tokens from auth responses', () => {
    const store = useUserStore()

    store.recordUserInfo({
      token: 'customer-token',
      user: {
        id: 9,
        username: '13800138000',
        phone: '13800138000',
      },
    })

    expect(store.customerToken).toBe('customer-token')
    expect(store.userId).toBe('9')
    expect(store.userName).toBe('13800138000')
    expect(localStorage.getItem('customer_token')).toBe('customer-token')
  })
})

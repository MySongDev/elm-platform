import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getUserInfo as getUserInfoApi } from '@/services/api'
import { useUserStore } from './store-user'

vi.mock('@/services/api', () => ({
  getUserInfo: vi.fn(),
}))

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(getUserInfoApi).mockReset()
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
      refreshToken: 'refresh-token',
      expiresIn: 1800,
      refreshExpiresIn: 2592000,
      user: {
        id: 9,
        username: '13800138000',
        phone: '13800138000',
      },
    })

    expect(store.customerToken).toBe('customer-token')
    expect(store.customerRefreshToken).toBe('refresh-token')
    expect(store.isTokenFresh).toBe(true)
    expect(store.userId).toBe('9')
    expect(store.userName).toBe('13800138000')
    expect(localStorage.getItem('customer_token')).toBe('customer-token')
    expect(localStorage.getItem('customer_refresh_token')).toBe('refresh-token')
    expect(Number(localStorage.getItem('customer_token_expires_at'))).toBeGreaterThan(Date.now())
    expect(Number(localStorage.getItem('customer_refresh_token_expires_at'))).toBeGreaterThan(Date.now())
  })

  it('clears expired refresh sessions before treating users as authenticated', () => {
    localStorage.setItem('customer_token', 'expired-access-token')
    localStorage.setItem('customer_refresh_token', 'expired-refresh-token')
    localStorage.setItem('customer_token_expires_at', String(Date.now() - 1000))
    localStorage.setItem('customer_refresh_token_expires_at', String(Date.now() - 1000))
    localStorage.setItem('user_id', '9')

    const store = useUserStore()

    expect(store.hasRefreshSession).toBe(false)
    expect(store.userId).toBe('')
    expect(localStorage.getItem('customer_token')).toBeNull()
    expect(localStorage.getItem('customer_refresh_token')).toBeNull()
  })

  it('restores the profile when only a valid refresh session is persisted', async () => {
    localStorage.setItem('customer_refresh_token', 'refresh-token')
    localStorage.setItem('customer_refresh_token_expires_at', String(Date.now() + 60_000))
    vi.mocked(getUserInfoApi).mockResolvedValueOnce({
      id: 9,
      username: 'song',
      phone: '13800138000',
    })

    const store = useUserStore()
    const profile = await store.getUserInfo()

    expect(getUserInfoApi).toHaveBeenCalledTimes(1)
    expect(profile).toMatchObject({ id: 9 })
    expect(store.isLogin).toBe(true)
    expect(store.userId).toBe('9')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('refreshCustomerToken', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('refreshes once and stores rotated tokens', async () => {
    localStorage.setItem('customer_refresh_token', 'old-refresh-token')
    const { refreshCustomerToken } = await import('./auth-refresh')
    const request = vi.fn().mockResolvedValue({
      code: 200,
      data: {
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 1800,
        refreshExpiresIn: 2592000,
      },
    })

    const [first, second] = await Promise.all([
      refreshCustomerToken(request),
      refreshCustomerToken(request),
    ])

    expect(first).toBe('new-access-token')
    expect(second).toBe('new-access-token')
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/customer-auth/refresh',
      method: 'post',
      data: { refreshToken: 'old-refresh-token' },
    }))
    expect(localStorage.getItem('customer_token')).toBe('new-access-token')
    expect(localStorage.getItem('customer_refresh_token')).toBe('new-refresh-token')
    expect(Number(localStorage.getItem('customer_token_expires_at'))).toBeGreaterThan(Date.now())
    expect(Number(localStorage.getItem('customer_refresh_token_expires_at'))).toBeGreaterThan(Date.now())
  })

  it('skips refresh when there is no refresh token', async () => {
    const { refreshCustomerToken } = await import('./auth-refresh')
    const request = vi.fn()

    await expect(refreshCustomerToken(request)).resolves.toBeNull()

    expect(request).not.toHaveBeenCalled()
  })
})

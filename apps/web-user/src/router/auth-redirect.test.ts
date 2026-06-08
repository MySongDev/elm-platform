import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('user router auth redirects', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('sends restored users away from login to the redirect target', async () => {
    localStorage.setItem('user_id', '9')
    localStorage.setItem('customer_refresh_token', 'refresh-token')
    localStorage.setItem('customer_refresh_token_expires_at', String(Date.now() + 60_000))

    const { default: router } = await import('./index')

    await router.push({
      path: '/login',
      query: { redirect: '/profile/info' },
    })
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/profile/info')
  }, 10_000)
})

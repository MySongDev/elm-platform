import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from '@/shared/api/request'
import { useAuthStore } from './store'

vi.mock('@/shared/api/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('useAuthStore session expiry', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
    })
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-23T00:00:00.000Z'))
    vi.mocked(request.post).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rejects restored tokens that do not have an expiry timestamp', () => {
    const store = useAuthStore()

    store.token = 'legacy-token'
    store.tokenExpiresAt = 0

    expect(store.ensureSessionValid()).toBe(false)
    expect(store.isLoggedIn).toBe(false)
    expect(store.token).toBe('')
  })

  it('uses the backend expiry seconds when rememberMe changes the session ttl', async () => {
    vi.mocked(request.post).mockResolvedValueOnce({
      token: 'remembered-token',
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: 1,
        username: 'admin',
        role: 'admin',
        status: 1,
        permissions: ['*:*:*'],
      },
    })

    const store = useAuthStore()
    await store.login({ account: 'admin', password: 'admin123', rememberMe: true })

    expect(store.token).toBe('remembered-token')
    expect(store.tokenExpiresAt).toBe(Date.now() + 7 * 24 * 60 * 60 * 1000)
    expect(store.isLoggedIn).toBe(true)
  })
})

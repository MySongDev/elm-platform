import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

function createMemoryStorage() {
  const storage = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    get length() {
      return storage.size
    },
  } as Storage
}

describe('useAuthStore persisted session recovery', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-27T00:00:00.000Z'))
    vi.stubGlobal('localStorage', createMemoryStorage())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.doUnmock('@/shared/api/request')
  })

  it('recovers a remembered token and can reload the current user profile', async () => {
    const get = vi.fn().mockResolvedValue({
      id: 1,
      username: 'admin',
      role: 'admin',
      status: 1,
      permissions: ['*:*:*'],
    })
    vi.doMock('@/shared/api/request', () => ({
      default: {
        get,
        post: vi.fn(),
        patch: vi.fn(),
      },
    }))

    localStorage.setItem('elm-admin-auth', JSON.stringify({
      token: 'remembered-token',
      tokenExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }))

    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    createApp({}).use(pinia)
    setActivePinia(pinia)

    const { useAuthStore } = await import('./store')
    const store = useAuthStore()

    expect(store.ensureSessionValid()).toBe(true)
    expect(store.token).toBe('remembered-token')

    await store.getUserInfo()

    expect(get).toHaveBeenCalledWith('/auth/profile')
    expect(store.userInfo?.username).toBe('admin')
  })
})

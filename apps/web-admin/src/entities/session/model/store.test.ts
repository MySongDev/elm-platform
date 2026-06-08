import type { LoginResult } from './store'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authEndpoints } from '@/shared/api/endpoints'

let request: typeof import('@/shared/api/request').default
let useAuthStore: typeof import('./store').useAuthStore

describe('useAuthStore session expiry', () => {
  beforeEach(async () => {
    vi.resetModules()
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
    vi.doMock('@/shared/api/request', () => ({
      default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      },
    }))
    ;({ default: request } = await import('@/shared/api/request'))
    ;({ useAuthStore } = await import('./store'))
    vi.mocked(request.get).mockReset()
    vi.mocked(request.post).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.doUnmock('@/shared/api/request')
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
    const loginResult = {
      token: 'remembered-token',
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: 1,
        username: 'admin',
        role: 'admin',
        status: 1,
        permissions: ['*:*:*'],
        email: 'admin@example.com',
        phone: '13800138000',
        avatar: null,
        tenant: {
          id: 10,
          code: 'default',
          name: 'Default Tenant',
          status: 'ACTIVE',
        },
        dataScope: 'SHOP',
        boundShopIds: ['shop-1'],
      },
    } satisfies LoginResult

    vi.mocked(request.post).mockResolvedValueOnce(loginResult)

    const store = useAuthStore()
    const result = await store.login({
      account: 'admin',
      password: 'admin123',
      rememberMe: true,
    })

    expect(request.post).toHaveBeenCalledWith(authEndpoints.login, {
      account: 'admin',
      password: 'admin123',
      rememberMe: true,
    })
    expect(result).toBe(loginResult)
    expect(store.token).toBe('remembered-token')
    expect(store.tokenExpiresAt).toBe(Date.now() + 7 * 24 * 60 * 60 * 1000)
    expect(store.userInfo).toMatchObject({
      boundShopIds: ['shop-1'],
      dataScope: 'SHOP',
      tenant: {
        code: 'default',
        status: 'ACTIVE',
      },
    })
    expect(store.isLoggedIn).toBe(true)
  })

  it('uses local mock auth without requesting the backend when enabled for development', async () => {
    vi.stubEnv('VITE_ADMIN_MOCK_AUTH', 'true')

    const store = useAuthStore()
    const result = await store.login({
      account: 'dev-admin',
      password: 'admin123',
    })

    expect(request.post).not.toHaveBeenCalled()
    expect(result.token).toBe('dev-mock-admin-token')
    expect(store.token).toBe('dev-mock-admin-token')
    expect(store.userInfo?.username).toBe('dev-admin')
    expect(store.permissions).toContain('*:*:*')
    expect(store.isLoggedIn).toBe(true)
  })

  it('loads profile and menus locally without backend requests when mock auth is enabled', async () => {
    vi.stubEnv('VITE_ADMIN_MOCK_AUTH', 'true')

    const store = useAuthStore()
    store.token = 'dev-mock-admin-token'
    store.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000

    await store.getUserInfo()
    const menus = await store.loadUserMenus()

    expect(request.get).not.toHaveBeenCalled()
    expect(store.userInfo?.role).toBe('admin')
    expect(menus[0]).toMatchObject({
      path: '/dashboard',
      children: [
        expect.objectContaining({
          path: '/dashboard/index',
        }),
      ],
    })
  })
})

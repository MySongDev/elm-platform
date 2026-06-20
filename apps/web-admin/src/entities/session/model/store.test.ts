import type { LoginResult } from '../api'
import type { UserInfo } from '@/entities/user'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let login: typeof import('../api').login
let getCurrentUser: typeof import('../api').getCurrentUser
let getUserMenus: typeof import('../api').getUserMenus
let updateProfile: typeof import('../api').updateProfile
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
    vi.doMock('../api', () => ({
      login: vi.fn(),
      getCurrentUser: vi.fn(),
      getUserMenus: vi.fn(),
      updateProfile: vi.fn(),
    }))
    ;({ login, getCurrentUser, getUserMenus, updateProfile } = await import('../api'))
    ;({ useAuthStore } = await import('./store'))
    vi.mocked(login).mockReset()
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(getUserMenus).mockReset()
    vi.mocked(updateProfile).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.doUnmock('../api')
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
    vi.mocked(login).mockResolvedValueOnce(loginResult)

    const store = useAuthStore()
    const credentials = {
      account: 'admin',
      password: 'admin123',
      rememberMe: true,
    }
    const result = await store.login(credentials)

    expect(login).toHaveBeenCalledWith(credentials)
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

  it('loads user profile and menus through session api', async () => {
    const user: UserInfo = {
      id: 1,
      username: 'admin',
      role: 'admin',
      status: 1,
      permissions: ['*:*:*'],
      email: 'admin@example.com',
      phone: '13800138000',
      avatar: null,
    }
    const menus = [
      {
        id: 1,
        parentId: null,
        title: 'Dashboard',
        path: '/dashboard',
        name: 'Dashboard',
        icon: null,
        permission: null,
        component: null,
        type: 'catalog' as const,
        sort: 1,
        status: 1,
      },
    ]
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user)
    vi.mocked(getUserMenus).mockResolvedValueOnce(menus)

    const store = useAuthStore()
    store.token = 'valid-token'
    store.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000

    await store.getUserInfo()
    const loadedMenus = await store.loadUserMenus()

    expect(getCurrentUser).toHaveBeenCalledOnce()
    expect(getUserMenus).toHaveBeenCalledOnce()
    expect(store.userInfo).toStrictEqual(user)
    expect(loadedMenus).toStrictEqual(menus)
  })

  it('updates user info through session api', async () => {
    const profilePatch = {
      username: 'new-name',
      email: 'new@example.com',
      phone: '13900139000',
    }
    const updatedUser: UserInfo = {
      id: 1,
      username: 'new-name',
      role: 'admin',
      status: 1,
      permissions: ['*:*:*'],
      email: 'new@example.com',
      phone: '13900139000',
      avatar: null,
    }
    vi.mocked(updateProfile).mockResolvedValueOnce(updatedUser)

    const store = useAuthStore()
    const result = await store.updateUserInfo(profilePatch)

    expect(updateProfile).toHaveBeenCalledWith(profilePatch)
    expect(result).toStrictEqual(updatedUser)
    expect(store.userInfo).toStrictEqual(updatedUser)
  })

  it('clears token on authentication error when loading user info', async () => {
    const error = new Error('Unauthorized')
    Object.assign(error, { response: { status: 401 } })
    vi.mocked(getCurrentUser).mockRejectedValueOnce(error)

    const store = useAuthStore()
    store.token = 'expired-token'
    store.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000

    await store.getUserInfo()

    expect(store.token).toBe('')
    expect(store.userInfo).toBeNull()
  })
})

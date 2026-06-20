import type { LoginResult } from './contracts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authEndpoints } from '@/shared/api/endpoints'

let request: typeof import('@/shared/api/request').default
let api: typeof import('./index')

describe('session api', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('VITE_ADMIN_MOCK_AUTH', 'false')
    vi.doMock('@/shared/api/request', () => ({
      default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      },
    }))
    ;({ default: request } = await import('@/shared/api/request'))
    api = await import('./index')
  })

  afterEach(() => {
    vi.doUnmock('@/shared/api/request')
    vi.unstubAllEnvs()
  })

  it('delegates login to shared request with endpoint and credentials', async () => {
    const loginResult: LoginResult = {
      token: 'test-token',
      expiresIn: 3600,
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
          id: 1,
          code: 'default',
          name: 'Default Tenant',
          status: 'ACTIVE',
        },
        dataScope: 'ALL',
        boundShopIds: [],
      },
    }
    vi.mocked(request.post).mockResolvedValueOnce(loginResult)

    const credentials = {
      account: 'admin',
      password: 'admin123',
      rememberMe: true,
    }
    const result = await api.login(credentials)

    expect(request.post).toHaveBeenCalledWith(authEndpoints.login, credentials)
    expect(result).toBe(loginResult)
  })

  it('delegates getCurrentUser to shared request profile endpoint', async () => {
    const user = {
      id: 1,
      username: 'admin',
      role: 'admin',
      status: 1,
      permissions: ['*:*:*'],
      email: null,
      phone: null,
      avatar: null,
    }
    vi.mocked(request.get).mockResolvedValueOnce(user)

    const result = await api.getCurrentUser()

    expect(request.get).toHaveBeenCalledWith(authEndpoints.profile)
    expect(result).toBe(user)
  })

  it('delegates getUserMenus to shared request menus endpoint', async () => {
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
    vi.mocked(request.get).mockResolvedValueOnce(menus)

    const result = await api.getUserMenus()

    expect(request.get).toHaveBeenCalledWith(authEndpoints.menus)
    expect(result).toBe(menus)
  })

  it('delegates updateProfile to shared request patch profile endpoint', async () => {
    const profilePatch = {
      username: 'new-name',
      email: 'new@example.com',
      phone: '13900139000',
    }
    const user = {
      id: 1,
      username: 'new-name',
      role: 'admin',
      status: 1,
      permissions: ['*:*:*'],
      email: 'new@example.com',
      phone: '13900139000',
      avatar: null,
    }
    vi.mocked(request.patch).mockResolvedValueOnce(user)

    const result = await api.updateProfile(profilePatch)

    expect(request.patch).toHaveBeenCalledWith(authEndpoints.profile, profilePatch)
    expect(result).toBe(user)
  })

  it('delegates getSecurityLogs to shared request with query params', async () => {
    const query = {
      page: 1,
      pageSize: 10,
    }
    const securityLogResult = {
      list: [],
      total: 0,
      page: 1,
      pageSize: 10,
    }
    vi.mocked(request.get).mockResolvedValueOnce(securityLogResult)

    const result = await api.getSecurityLogs(query)

    expect(request.get).toHaveBeenCalledWith(authEndpoints.securityLogs, { params: query })
    expect(result).toBe(securityLogResult)
  })
})

describe('session api mock mode', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('VITE_ADMIN_MOCK_AUTH', 'true')
    vi.doMock('@/shared/api/request', () => ({
      default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      },
    }))
    ;({ default: request } = await import('@/shared/api/request'))
    api = await import('./index')
  })

  afterEach(() => {
    vi.doUnmock('@/shared/api/request')
    vi.unstubAllEnvs()
  })

  it('returns mock login result without calling request', async () => {
    const credentials = {
      account: 'dev-admin',
      password: 'admin123',
      rememberMe: true,
    }
    const result = await api.login(credentials)

    expect(request.post).not.toHaveBeenCalled()
    expect(result.token).toBe('dev-mock-admin-token')
    expect(result.expiresIn).toBe(7 * 24 * 60 * 60)
    expect(result.user.username).toBe('dev-admin')
  })

  it('returns mock current user without calling request', async () => {
    const result = await api.getCurrentUser()

    expect(request.get).not.toHaveBeenCalled()
    expect(result.username).toBe('dev-admin')
    expect(result.role).toBe('admin')
  })

  it('returns mock user menus without calling request', async () => {
    const result = await api.getUserMenus()

    expect(request.get).not.toHaveBeenCalled()
    expect(result[0].path).toBe('/dashboard')
  })

  it('updates mock profile and returns updated user without calling request', async () => {
    const result = await api.updateProfile({ username: 'updated-admin' })

    expect(request.patch).not.toHaveBeenCalled()
    expect(result.username).toBe('updated-admin')
  })

  it('returns mock security logs without calling request', async () => {
    const result = await api.getSecurityLogs({
      page: 1,
      pageSize: 10,
    })

    expect(request.get).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      list: expect.any(Array),
      total: expect.any(Number),
      page: 1,
      pageSize: 10,
    })
  })
})

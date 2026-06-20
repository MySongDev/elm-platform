import type { MockMethod } from 'vite-plugin-mock'
import type { NotificationItem } from '../src/entities/notification'
import type { LoginResult } from '../src/entities/session/api/contracts'
import type {
  SecurityLogResult,
  UserMenuNode,
} from '../src/entities/session/model/types'
import type { UserInfo } from '../src/entities/user'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAuthMockRoutes } from './routes/auth'
import { createNotificationMockRoutes } from './routes/notifications'
import { resetNotificationMockState } from './state/notification-state'

interface MockRequestContext {
  body?: unknown
  query?: Record<string, unknown>
  params?: Record<string, string>
  headers?: Record<string, unknown>
}

interface MockEnvelope<T> {
  code: number
  data: T
  message: string
}

let routes: MockMethod[]

function routeMatches(route: MockMethod, method: string, url: string) {
  if (route.method !== method)
    return false
  const pattern = route.url.replace(/:[^/]+/g, '([^/]+)')
  const regex = new RegExp(`^${pattern}$`)
  return regex.test(url)
}

function invokeRoute<T>(method: string, url: string, context: MockRequestContext = {}) {
  const route = routes.find(item => routeMatches(item, method, url))
  if (!route)
    throw new Error(`Missing mock route: ${method.toUpperCase()} ${url}`)
  if (typeof route.response !== 'function')
    throw new TypeError(`Mock route response is not callable: ${method.toUpperCase()} ${url}`)
  const handler = route.response as (value: MockRequestContext) => MockEnvelope<T>

  const params: Record<string, string> = {}
  const pattern = route.url.replace(/:[^/]+/g, '([^/]+)')
  const regex = new RegExp(`^${pattern}$`)
  const match = url.match(regex)
  if (match) {
    const paramNames = Array.from(route.url.matchAll(/:([^/]+)/g), m => m[1])
    paramNames.forEach((name, i) => { params[name] = match[i + 1] })
  }

  return handler({
    ...context,
    params,
  })
}

beforeEach(() => {
  resetNotificationMockState()
  routes = [...createAuthMockRoutes(), ...createNotificationMockRoutes()]
})

describe('admin auth mock routes', () => {
  it('registers ten unique mock routes (5 auth + 5 notification) with the full API prefix', () => {
    const keys = routes.map(route => `${route.method} ${route.url}`)
    expect(keys).toContain('post /api/auth/login')
    expect(keys).toContain('get /api/admin/notifications')
    expect(keys).toContain('patch /api/admin/notifications/read-all')
    expect(keys).toContain('patch /api/admin/notifications/:id/read')
    expect(keys).toContain('delete /api/admin/notifications/:id')
    expect(keys).toContain('delete /api/admin/notifications')
    expect(new Set(keys).size).toBe(10)
  })

  it('reads login body and returns the remembered session ttl', () => {
    const response = invokeRoute<LoginResult>('post', '/api/auth/login', {
      body: {
        account: 'course-admin',
        password: 'admin123',
        rememberMe: true,
      },
    })
    expect(response).toMatchObject({
      code: 200,
      message: 'success',
      data: {
        token: 'dev-mock-admin-token',
        expiresIn: 7 * 24 * 60 * 60,
        user: { username: 'course-admin' },
      },
    })
  })

  it('keeps profile updates visible to later profile requests', () => {
    invokeRoute<UserInfo>('patch', '/api/auth/profile', {
      body: {
        username: 'updated-admin',
        email: 'updated@example.com',
      },
    })
    expect(invokeRoute<UserInfo>('get', '/api/auth/profile').data).toMatchObject({
      username: 'updated-admin',
      email: 'updated@example.com',
    })
  })

  it('returns a fresh menu tree for every request', () => {
    const first = invokeRoute<UserMenuNode[]>('get', '/api/auth/menus').data
    const second = invokeRoute<UserMenuNode[]>('get', '/api/auth/menus').data
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first[0]).not.toBe(second[0])
  })

  it('normalizes security log pagination from query strings', () => {
    const response = invokeRoute<SecurityLogResult>('get', '/api/auth/security-logs', {
      query: {
        page: '2',
        pageSize: '20',
      },
    })
    expect(response).toEqual({
      code: 200,
      message: 'success',
      data: {
        list: [],
        total: 0,
        page: 2,
        pageSize: 20,
      },
    })
  })

  it('appends a security-login notification when login succeeds', () => {
    const before = invokeRoute<NotificationItem[]>('get', '/api/admin/notifications').data
    expect(before).toHaveLength(6)

    invokeRoute<LoginResult>('post', '/api/auth/login', {
      body: {
        account: 'admin',
        password: 'admin123',
      },
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) AppleWebKit Chrome' },
    })

    const after = invokeRoute<NotificationItem[]>('get', '/api/admin/notifications').data
    expect(after).toHaveLength(7)
    const head = after[0]
    expect(head.title).toBe('安全登录提醒')
    expect(head.source).toBe('SECURITY_LOGIN')
    expect(head.type).toBe('notification')
    expect(head.description).toContain('Chrome')
    expect(head.description).toContain('macOS')
  })
})

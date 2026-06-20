import type { MockMethod } from 'vite-plugin-mock'
import type { LoginResult } from '../src/entities/session/api/contracts'
import type {
  SecurityLogResult,
  UserMenuNode,
} from '../src/entities/session/model/types'
import type { UserInfo } from '../src/entities/user'
import { beforeEach, describe, expect, it } from 'vitest'
import { createAuthMockRoutes } from './routes/auth'

interface MockRequestContext {
  body?: unknown
  query?: Record<string, unknown>
}

interface MockEnvelope<T> {
  code: number
  data: T
  message: string
}

let routes: MockMethod[]

function invokeRoute<T>(method: string, url: string, context: MockRequestContext = {}) {
  const route = routes.find(item => item.method === method && item.url === url)
  if (!route)
    throw new Error(`Missing mock route: ${method.toUpperCase()} ${url}`)
  if (typeof route.response !== 'function')
    throw new TypeError(`Mock route response is not callable: ${method.toUpperCase()} ${url}`)
  const handler = route.response as (value: MockRequestContext) => MockEnvelope<T>
  return handler(context)
}

beforeEach(() => {
  routes = createAuthMockRoutes()
})

describe('admin auth mock routes', () => {
  it('registers five unique auth routes with the full API prefix', () => {
    expect(routes.map(route => `${route.method} ${route.url}`)).toEqual([
      'post /api/auth/login',
      'get /api/auth/profile',
      'patch /api/auth/profile',
      'get /api/auth/menus',
      'get /api/auth/security-logs',
    ])
    expect(new Set(routes.map(route => `${route.method} ${route.url}`)).size).toBe(5)
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
})

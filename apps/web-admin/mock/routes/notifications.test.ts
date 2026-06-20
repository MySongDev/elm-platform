import type { MockMethod } from 'vite-plugin-mock'
import type { NotificationItem } from '../../src/entities/notification'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  resetNotificationMockState,
  sharedNotificationMockState,
} from '../state/notification-state'
import { createNotificationMockRoutes } from './notifications'

interface MockRequestContext {
  body?: unknown
  query?: Record<string, unknown>
  params?: Record<string, string>
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

function invoke<T>(method: string, url: string, context: MockRequestContext = {}): MockEnvelope<T> {
  const route = routes.find(item => routeMatches(item, method, url))
  if (!route)
    throw new Error(`Missing mock route: ${method.toUpperCase()} ${url}`)
  if (typeof route.response !== 'function')
    throw new TypeError(`Mock route response is not callable: ${method.toUpperCase()} ${url}`)
  const handler = route.response as (value: MockRequestContext) => MockEnvelope<T>

  // Extract params from dynamic segments
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
  routes = createNotificationMockRoutes()
})

describe('admin notification mock routes', () => {
  it('registers the five notification routes under /api', () => {
    const keys = routes.map(route => `${route.method} ${route.url}`).sort()
    expect(keys).toEqual([
      'delete /api/admin/notifications',
      'delete /api/admin/notifications/:id',
      'get /api/admin/notifications',
      'patch /api/admin/notifications/:id/read',
      'patch /api/admin/notifications/read-all',
    ])
  })

  it('gET / returns seed list sorted by createdAt desc', () => {
    const data = invoke<NotificationItem[]>('get', '/api/admin/notifications').data
    expect(data).toHaveLength(6)
    // First item is the newest = system upgrade (10 minutes ago)
    expect(data[0].id).toBe('seed-notify-1')
  })

  it('gET /?type filters by type', () => {
    const data = invoke<NotificationItem[]>('get', '/api/admin/notifications', {
      query: { type: 'todo' },
    }).data
    expect(data.every(item => item.type === 'todo')).toBe(true)
  })

  it('gET /?type=bogus rejects with 400', () => {
    const response = invoke<null>('get', '/api/admin/notifications', {
      query: { type: 'bogus' },
    })
    expect(response.code).toBe(400)
  })

  it('pATCH /:id/read marks single as read', () => {
    const updated = invoke<NotificationItem>('patch', '/api/admin/notifications/seed-notify-1/read').data
    expect(updated.read).toBe(true)
    expect(updated.readAt).toBeTruthy()
  })

  it('pATCH /:id/read returns 404 for unknown id', () => {
    const response = invoke<null>('patch', '/api/admin/notifications/not-exist/read')
    expect(response.code).toBe(404)
  })

  it('pATCH /read-all marks all of given type', () => {
    const response = invoke<{ updatedCount: number }>('patch', '/api/admin/notifications/read-all', {
      body: { type: 'message' },
    })
    expect(response.data.updatedCount).toBe(2)
    const list = invoke<NotificationItem[]>('get', '/api/admin/notifications', {
      query: { type: 'message' },
    }).data
    expect(list.every(item => item.read)).toBe(true)
  })

  it('dELETE /:id removes a single notification', () => {
    const response = invoke<{ success: true }>('delete', '/api/admin/notifications/seed-notify-1')
    expect(response.data.success).toBe(true)
    expect(sharedNotificationMockState.state).toHaveLength(5)
  })

  it('dELETE / clears all when type is omitted', () => {
    const response = invoke<{ deletedCount: number }>('delete', '/api/admin/notifications')
    expect(response.data.deletedCount).toBe(6)
    expect(sharedNotificationMockState.state).toEqual([])
  })

  it('dELETE /?type=todo filters removal', () => {
    const response = invoke<{ deletedCount: number }>('delete', '/api/admin/notifications', {
      query: { type: 'todo' },
    })
    expect(response.data.deletedCount).toBe(2)
    expect(sharedNotificationMockState.state.every(item => item.type !== 'todo')).toBe(true)
  })
})

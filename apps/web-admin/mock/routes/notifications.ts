import type { MockMethod } from 'vite-plugin-mock'
import type { NotificationItem } from '../../src/entities/notification'
import {
  MockNotificationNotFound,
  sharedNotificationMockState,
} from '../state/notification-state'

function success<T>(data: T) {
  return {
    code: 200,
    data,
    message: 'success',
  }
}

function failure(code: number, message: string) {
  return {
    code,
    data: null,
    message,
  }
}

function isValidType(value: unknown): value is NotificationItem['type'] {
  return value === 'notification' || value === 'message' || value === 'todo'
}

function normalizeType(value: unknown): NotificationItem['type'] | undefined {
  if (value === undefined || value === null || value === '')
    return undefined
  if (!isValidType(value))
    throw new Error(`不支持的通知类型：${String(value)}`)
  return value
}

export function createNotificationMockRoutes(): MockMethod[] {
  return [
    {
      url: '/api/admin/notifications',
      method: 'get',
      response: ({ query }) => {
        try {
          const type = normalizeType(query?.type)
          return success(sharedNotificationMockState.list(type))
        }
        catch (err) {
          return failure(400, err instanceof Error ? err.message : '请求失败')
        }
      },
    },
    {
      url: '/api/admin/notifications/read-all',
      method: 'patch',
      response: ({ body }) => {
        try {
          const type = normalizeType((body as { type?: unknown } | undefined)?.type)
          const updatedCount = sharedNotificationMockState.markAllRead(type)
          return success({ updatedCount })
        }
        catch (err) {
          return failure(400, err instanceof Error ? err.message : '请求失败')
        }
      },
    },
    {
      url: '/api/admin/notifications/:id/read',
      method: 'patch',
      response: ({ params }) => {
        try {
          return success(sharedNotificationMockState.markRead(params.id))
        }
        catch (err) {
          if (err instanceof MockNotificationNotFound)
            return failure(404, err.message)
          return failure(500, err instanceof Error ? err.message : '请求失败')
        }
      },
    },
    {
      url: '/api/admin/notifications/:id',
      method: 'delete',
      response: ({ params }) => {
        try {
          sharedNotificationMockState.remove(params.id)
          return success({ success: true })
        }
        catch (err) {
          if (err instanceof MockNotificationNotFound)
            return failure(404, err.message)
          return failure(500, err instanceof Error ? err.message : '请求失败')
        }
      },
    },
    {
      url: '/api/admin/notifications',
      method: 'delete',
      response: ({ query }) => {
        try {
          const type = normalizeType(query?.type)
          const deletedCount = sharedNotificationMockState.clear(type)
          return success({ deletedCount })
        }
        catch (err) {
          return failure(400, err instanceof Error ? err.message : '请求失败')
        }
      },
    },
  ]
}

export default createNotificationMockRoutes()

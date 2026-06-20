import type { NotificationApi } from './contracts'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notificationEndpoints } from '@/shared/api/endpoints'
import { createRealNotificationApi } from './real-notification-api'

describe('notification API adapter', () => {
  let api: NotificationApi
  const mockHttp = {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api = createRealNotificationApi(mockHttp as any)
  })

  it('list delegates to GET /admin/notifications', async () => {
    mockHttp.get.mockResolvedValueOnce([])
    const result = await api.list()
    expect(mockHttp.get).toHaveBeenCalledWith(notificationEndpoints.list, {})
    expect(result).toEqual([])
  })

  it('list passes type query param when provided', async () => {
    mockHttp.get.mockResolvedValueOnce([])
    await api.list('todo')
    expect(mockHttp.get).toHaveBeenCalledWith(notificationEndpoints.list, { params: { type: 'todo' } })
  })

  it('markAllRead delegates to PATCH /admin/notifications/read-all', async () => {
    mockHttp.patch.mockResolvedValueOnce({ updatedCount: 3 })
    const result = await api.markAllRead('message')
    expect(mockHttp.patch).toHaveBeenCalledWith(notificationEndpoints.markAllRead, { type: 'message' })
    expect(result.updatedCount).toBe(3)
  })

  it('markRead delegates to PATCH /admin/notifications/:id/read', async () => {
    mockHttp.patch.mockResolvedValueOnce({
      id: 'n1',
      read: true,
    } as any)
    const result = await api.markRead('n1')
    expect(mockHttp.patch).toHaveBeenCalledWith(notificationEndpoints.markRead('n1'))
    expect(result.id).toBe('n1')
  })

  it('remove delegates to DELETE /admin/notifications/:id', async () => {
    mockHttp.delete.mockResolvedValueOnce({ success: true })
    const result = await api.remove('n1')
    expect(mockHttp.delete).toHaveBeenCalledWith(notificationEndpoints.remove('n1'))
    expect(result.success).toBe(true)
  })

  it('clear delegates to DELETE /admin/notifications with type', async () => {
    mockHttp.delete.mockResolvedValueOnce({ deletedCount: 5 })
    const result = await api.clear('todo')
    expect(mockHttp.delete).toHaveBeenCalledWith(notificationEndpoints.clear, { params: { type: 'todo' } })
    expect(result.deletedCount).toBe(5)
  })
})

import type { NotificationItem } from './types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let notificationApi: typeof import('../api').notificationApi
let useNotificationStore: typeof import('./store').useNotificationStore

function buildItem(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'noti-1',
    type: 'notification',
    title: '默认通知',
    description: null,
    avatar: null,
    status: null,
    read: false,
    createdAt: new Date('2026-06-20T08:00:00.000Z').toISOString(),
    readAt: null,
    ...overrides,
  }
}

describe('useNotificationStore', () => {
  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    vi.doMock('../api', () => ({
      notificationApi: {
        list: vi.fn(),
        markAllRead: vi.fn(),
        markRead: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
    }))
    ;({ notificationApi } = await import('../api'))
    ;({ useNotificationStore } = await import('./store'))
    vi.mocked(notificationApi.list).mockReset()
    vi.mocked(notificationApi.markAllRead).mockReset()
    vi.mocked(notificationApi.markRead).mockReset()
    vi.mocked(notificationApi.remove).mockReset()
    vi.mocked(notificationApi.clear).mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loadNotifications fetches and stores list once; second call is a no-op', async () => {
    const items = [buildItem({ id: 'a' }), buildItem({
      id: 'b',
      type: 'todo',
    })]
    vi.mocked(notificationApi.list).mockResolvedValueOnce(items)
    const store = useNotificationStore()

    await store.loadNotifications()

    expect(notificationApi.list).toHaveBeenCalledTimes(1)
    expect(store.notifications).toHaveLength(2)
    expect(store.loaded).toBe(true)
    expect(store.error).toBeNull()

    await store.loadNotifications()
    expect(notificationApi.list).toHaveBeenCalledTimes(1)

    await store.loadNotifications(true)
    expect(notificationApi.list).toHaveBeenCalledTimes(2)
  })

  it('loadNotifications records error and keeps previous data on failure', async () => {
    vi.mocked(notificationApi.list).mockResolvedValueOnce([buildItem()])
    const store = useNotificationStore()
    await store.loadNotifications()

    vi.mocked(notificationApi.list).mockRejectedValueOnce(new Error('network down'))
    await store.loadNotifications(true)

    expect(store.error?.message).toBe('network down')
    expect(store.notifications).toHaveLength(1)
  })

  it('markAsRead delegates to api and replaces the local item on success', async () => {
    const original = buildItem({
      id: 'n1',
      read: false,
    })
    vi.mocked(notificationApi.list).mockResolvedValueOnce([original])
    vi.mocked(notificationApi.markRead).mockResolvedValueOnce({
      ...original,
      read: true,
      readAt: new Date('2026-06-20T09:00:00.000Z').toISOString(),
    })
    const store = useNotificationStore()
    await store.loadNotifications()

    await store.markAsRead('n1')

    expect(notificationApi.markRead).toHaveBeenCalledWith('n1')
    expect(store.notifications[0].read).toBe(true)
    expect(store.notifications[0].readAt).toBeTruthy()
  })

  it('markAllAsRead marks every matching item as read', async () => {
    vi.mocked(notificationApi.list).mockResolvedValueOnce([
      buildItem({
        id: 'n1',
        read: false,
      }),
      buildItem({
        id: 'n2',
        type: 'message',
        read: false,
      }),
      buildItem({
        id: 'n3',
        type: 'todo',
        read: false,
      }),
    ])
    vi.mocked(notificationApi.markAllRead).mockResolvedValueOnce({ updatedCount: 3 })
    const store = useNotificationStore()
    await store.loadNotifications()

    await store.markAllAsRead('notification')

    expect(notificationApi.markAllRead).toHaveBeenCalledWith('notification')
    expect(store.notifications.find(n => n.id === 'n1')?.read).toBe(true)
    expect(store.notifications.find(n => n.id === 'n2')?.read).toBe(false)
  })

  it('removeNotification deletes the matching item', async () => {
    vi.mocked(notificationApi.list).mockResolvedValueOnce([buildItem({ id: 'n1' }), buildItem({ id: 'n2' })])
    vi.mocked(notificationApi.remove).mockResolvedValueOnce({ success: true })
    const store = useNotificationStore()
    await store.loadNotifications()

    await store.removeNotification('n1')

    expect(notificationApi.remove).toHaveBeenCalledWith('n1')
    expect(store.notifications.map(n => n.id)).toEqual(['n2'])
  })

  it('clearAll with type filters locally; without type empties everything', async () => {
    vi.mocked(notificationApi.list).mockResolvedValueOnce([
      buildItem({
        id: 'n1',
        type: 'notification',
      }),
      buildItem({
        id: 'n2',
        type: 'todo',
      }),
    ])
    vi.mocked(notificationApi.clear).mockResolvedValueOnce({ deletedCount: 1 })
    const store = useNotificationStore()
    await store.loadNotifications()

    await store.clearAll('notification')

    expect(notificationApi.clear).toHaveBeenCalledWith('notification')
    expect(store.notifications.map(n => n.id)).toEqual(['n2'])

    vi.mocked(notificationApi.clear).mockResolvedValueOnce({ deletedCount: 1 })
    await store.clearAll()
    expect(store.notifications).toEqual([])
  })

  it('reset wipes all state', async () => {
    vi.mocked(notificationApi.list).mockResolvedValueOnce([buildItem()])
    const store = useNotificationStore()
    await store.loadNotifications()

    store.reset()

    expect(store.notifications).toEqual([])
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})

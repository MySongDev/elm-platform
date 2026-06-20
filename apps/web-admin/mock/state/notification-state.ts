import type { NotificationItem } from '../../src/entities/notification'
import { cloneDevMockNotifications } from '../fixtures/notifications'

export interface SecurityLoginContext {
  ip?: string
  browser?: string
  os?: string
}

export class MockNotificationNotFound extends Error {
  constructor(id: string) {
    super(`notification ${id} not found`)
    this.name = 'MockNotificationNotFound'
  }
}

function buildSecurityLoginItem(context: SecurityLoginContext): NotificationItem {
  const ip = context.ip?.trim() || '127.0.0.1'
  const browser = context.browser?.trim() || 'Chrome'
  const os = context.os?.trim() || 'macOS'
  return {
    id: `sec-login-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'notification',
    title: '安全登录提醒',
    description: `${ip}（${browser} / ${os}）`,
    avatar: null,
    status: null,
    read: false,
    source: 'SECURITY_LOGIN',
    createdAt: new Date().toISOString(),
    readAt: null,
  }
}

function sortByCreatedAtDesc(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => {
    if (a.createdAt === b.createdAt)
      return b.id < a.id ? -1 : b.id > a.id ? 1 : 0
    return a.createdAt < b.createdAt ? 1 : -1
  })
}

export const sharedNotificationMockState = {
  state: cloneDevMockNotifications(),

  list(type?: NotificationItem['type']) {
    const filtered = type
      ? this.state.filter(item => item.type === type)
      : this.state
    return sortByCreatedAtDesc(filtered)
  },

  find(id: string): NotificationItem {
    const item = this.state.find(n => n.id === id)
    if (!item)
      throw new MockNotificationNotFound(id)
    return item
  },

  markRead(id: string): NotificationItem {
    const item = this.find(id)
    const updated: NotificationItem = {
      ...item,
      read: true,
      readAt: new Date().toISOString(),
    }
    this.state = this.state.map(n => (n.id === id ? updated : n))
    return updated
  },

  markAllRead(type?: NotificationItem['type']): number {
    const readAt = new Date().toISOString()
    let count = 0
    this.state = this.state.map((n) => {
      if (type && n.type !== type)
        return n
      if (n.read)
        return n
      count += 1
      return {
        ...n,
        read: true,
        readAt,
      }
    })
    return count
  },

  remove(id: string): void {
    const exists = this.state.some(n => n.id === id)
    if (!exists)
      throw new MockNotificationNotFound(id)
    this.state = this.state.filter(n => n.id !== id)
  },

  clear(type?: NotificationItem['type']): number {
    const before = this.state.length
    this.state = type
      ? this.state.filter(n => n.type !== type)
      : []
    return before - this.state.length
  },

  addSecurityLoginNotification(context: SecurityLoginContext = {}): NotificationItem {
    const item = buildSecurityLoginItem(context)
    this.state = [item, ...this.state]
    return item
  },

  reset() {
    this.state = cloneDevMockNotifications()
  },
}

export function resetNotificationMockState() {
  sharedNotificationMockState.reset()
}

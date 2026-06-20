import type { NotificationItem } from '../model/types'

export interface MarkAllReadResult { updatedCount: number }
export interface DeleteResult { success: true }
export interface ClearResult { deletedCount: number }

export type NotificationTypeFilter = NotificationItem['type']

export interface NotificationApi {
  list: (type?: NotificationTypeFilter) => Promise<NotificationItem[]>
  markAllRead: (type?: NotificationTypeFilter) => Promise<MarkAllReadResult>
  markRead: (id: string) => Promise<NotificationItem>
  remove: (id: string) => Promise<DeleteResult>
  clear: (type?: NotificationTypeFilter) => Promise<ClearResult>
}

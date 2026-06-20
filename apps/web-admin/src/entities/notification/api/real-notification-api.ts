import type { NotificationItem } from '../model/types'
import type {
  ClearResult,
  DeleteResult,
  MarkAllReadResult,
  NotificationApi,
  NotificationTypeFilter,
} from './contracts'
import type { TypedHttpClient } from '@/shared/api/http'
import { notificationEndpoints } from '@/shared/api/endpoints'

export function createRealNotificationApi(http: TypedHttpClient): NotificationApi {
  return {
    list: (type?: NotificationTypeFilter): Promise<NotificationItem[]> =>
      http.get<NotificationItem[]>(
        notificationEndpoints.list,
        type ? { params: { type } } : {},
      ),
    markAllRead: (type?: NotificationTypeFilter): Promise<MarkAllReadResult> =>
      http.patch<MarkAllReadResult>(
        notificationEndpoints.markAllRead,
        type ? { type } : {},
      ),
    markRead: (id: string): Promise<NotificationItem> =>
      http.patch<NotificationItem>(notificationEndpoints.markRead(id)),
    remove: (id: string): Promise<DeleteResult> =>
      http.delete<DeleteResult>(notificationEndpoints.remove(id)),
    clear: (type?: NotificationTypeFilter): Promise<ClearResult> =>
      http.delete<ClearResult>(
        notificationEndpoints.clear,
        type ? { params: { type } } : {},
      ),
  }
}

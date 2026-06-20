import type { NotificationApi } from './contracts'
import request from '@/shared/api/request'
import { createRealNotificationApi } from './real-notification-api'

/**
 * 全局通知 API 适配器，使用应用共享的 HTTP 客户端。
 * 由 store 和 mock 模式统一通过此实例调用。
 */
export const notificationApi: NotificationApi = createRealNotificationApi(request)

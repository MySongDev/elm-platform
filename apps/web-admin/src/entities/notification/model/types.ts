export interface NotificationItem {
  id: string
  /** 通知类型：notification | message | todo */
  type: 'notification' | 'message' | 'todo'
  title: string
  description?: string | null
  avatar?: string | null
  /** 待办状态 */
  status?: string | null
  read: boolean
  /** ISO 时间戳，由前端格式化展示 */
  createdAt: string
  /** ISO 时间戳，首次标记已读时间 */
  readAt?: string | null
}

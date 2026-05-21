export interface NotificationItem {
  id: string
  /** 通知类型：notification | message | todo */
  type: 'notification' | 'message' | 'todo'
  title: string
  description?: string
  time: string
  read: boolean
  avatar?: string
  /** 待办状态 */
  status?: string
}

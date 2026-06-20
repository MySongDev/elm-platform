import type { NotificationItem } from '../../src/entities/notification'

const MINUTE = 60_000

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * MINUTE).toISOString()
}

function isoTodayAt(hour: number) {
  // 当 hour > 23 时按次日处理，避免 setHours(24) 跨越日期造成排序歧义
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  // 若目标时间仍晚于 now，则按前一天表达，确保所有 fixture 都是"过去"
  if (d.getTime() > Date.now()) {
    d.setDate(d.getDate() - 1)
  }
  return d.toISOString()
}

export const DEV_MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'seed-notify-1',
    type: 'notification',
    title: '系统升级通知',
    description: '系统将于今晚 22:00 进行维护升级，预计耗时 2 小时',
    avatar: null,
    status: null,
    read: false,
    source: 'SEED',
    createdAt: isoMinutesAgo(10),
    readAt: null,
  },
  {
    id: 'seed-notify-2',
    type: 'notification',
    title: '安全提醒',
    description: '检测到您的账号在异地登录，如非本人操作请及时修改密码',
    avatar: null,
    status: null,
    read: false,
    source: 'SEED',
    createdAt: isoMinutesAgo(60),
    readAt: null,
  },
  {
    id: 'seed-notify-3',
    type: 'message',
    title: '张三',
    description: '你好，关于上次讨论的方案我已经整理好了，请查看',
    avatar: '',
    status: null,
    read: false,
    source: 'SEED',
    createdAt: isoMinutesAgo(30),
    readAt: null,
  },
  {
    id: 'seed-notify-4',
    type: 'message',
    title: '李四',
    description: '明天的会议改到下午 3 点，请注意时间变更',
    avatar: '',
    status: null,
    read: false,
    source: 'SEED',
    createdAt: isoMinutesAgo(120),
    readAt: null,
  },
  {
    id: 'seed-notify-5',
    type: 'todo',
    title: '审批待处理',
    description: '有 3 条请假审批等待处理',
    avatar: null,
    status: 'warning',
    read: false,
    source: 'SEED',
    createdAt: isoTodayAt(18),
    readAt: null,
  },
  {
    id: 'seed-notify-6',
    type: 'todo',
    title: '周报提交',
    description: '本周周报尚未提交',
    avatar: null,
    status: 'danger',
    read: false,
    source: 'SEED',
    createdAt: isoTodayAt(20),
    readAt: null,
  },
]

export function cloneDevMockNotifications(): NotificationItem[] {
  return DEV_MOCK_NOTIFICATIONS.map(item => ({ ...item }))
}

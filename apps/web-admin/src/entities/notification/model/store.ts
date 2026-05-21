/**
 * @file 通知中心状态
 * @domain entities/notification
 * @description 管理通知、消息和待办的前端聚合状态，当前包含 mock 数据加载入口。
 */

import type { NotificationItem } from './types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * @description 有副作用：创建通知 store，action 会生成本地通知 ID 并修改通知读写状态。
 * @returns 通知集合、未读统计和通知操作函数。
 */
export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length,
  )

  const getByType = computed(() => {
    return (type: NotificationItem['type']) =>
      notifications.value.filter(n => n.type === type)
  })

  const unreadByType = computed(() => {
    return (type: NotificationItem['type']) =>
      notifications.value.filter(n => n.type === type && !n.read).length
  })

  function addNotification(item: Omit<NotificationItem, 'id' | 'read'>) {
    notifications.value.unshift({
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      read: false,
    })
  }

  function markAsRead(id: string) {
    const item = notifications.value.find(n => n.id === id)
    if (item)
      item.read = true
  }

  function markAllAsRead(type?: NotificationItem['type']) {
    notifications.value.forEach((n) => {
      if (!type || n.type === type)
        n.read = true
    })
  }

  function removeNotification(id: string) {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx !== -1)
      notifications.value.splice(idx, 1)
  }

  function clearAll(type?: NotificationItem['type']) {
    if (type) {
      notifications.value = notifications.value.filter(n => n.type !== type)
    }
    else {
      notifications.value = []
    }
  }

  function loadMockData() {
    if (notifications.value.length > 0)
      return

    const mockData: Omit<NotificationItem, 'id' | 'read'>[] = [
      {
        type: 'notification',
        title: '系统升级通知',
        description: '系统将于今晚 22:00 进行维护升级，预计耗时 2 小时',
        time: '10 分钟前',
      },
      {
        type: 'notification',
        title: '安全提醒',
        description: '检测到您的账号在异地登录，如非本人操作请及时修改密码',
        time: '1 小时前',
      },
      {
        type: 'message',
        title: '张三',
        description: '你好，关于上次讨论的方案我已经整理好了，请查看',
        time: '30 分钟前',
        avatar: '',
      },
      {
        type: 'message',
        title: '李四',
        description: '明天的会议改到下午 3 点，请注意时间变更',
        time: '2 小时前',
        avatar: '',
      },
      {
        type: 'todo',
        title: '审批待处理',
        description: '有 3 条请假审批等待处理',
        time: '截止今天 18:00',
        status: 'warning',
      },
      {
        type: 'todo',
        title: '周报提交',
        description: '本周周报尚未提交',
        time: '截止今天 24:00',
        status: 'danger',
      },
    ]

    mockData.forEach(item => addNotification(item))
  }

  return {
    notifications,
    unreadCount,
    getByType,
    unreadByType,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    loadMockData,
  }
})

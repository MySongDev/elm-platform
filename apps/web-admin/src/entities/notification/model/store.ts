/**
 * @file 通知中心状态
 * @domain entities/notification
 * @description 管理通知、消息和待办的远端数据客户端状态，所有读写都经由 NotificationApi。
 */

import type { NotificationApi } from '../api/contracts'
import type { NotificationItem } from './types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { notificationApi } from '../api'

/**
 * @description 有副作用：创建通知 store，所有 action 通过注入的 NotificationApi 与服务端同步；本 store 不维护本地写入入口。
 * @returns 通知集合、未读统计和远端操作函数。
 */
export const useNotificationStore = defineStore('notification', () => {
  // state
  const notifications = ref<NotificationItem[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<Error | null>(null)

  // getters
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

  // internal
  function pickApi(): NotificationApi {
    return notificationApi
  }

  // actions
  async function loadNotifications(force = false) {
    if (loaded.value && !force)
      return
    loading.value = true
    error.value = null
    try {
      notifications.value = await pickApi().list()
      loaded.value = true
    }
    catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    }
    finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    try {
      const updated = await pickApi().markRead(id)
      const idx = notifications.value.findIndex(n => n.id === id)
      if (idx !== -1)
        notifications.value[idx] = updated
    }
    catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    }
  }

  async function markAllAsRead(type?: NotificationItem['type']) {
    try {
      const { updatedCount } = await pickApi().markAllRead(type)
      const readAt = new Date().toISOString()
      notifications.value = notifications.value.map((n) => {
        if (type && n.type !== type)
          return n
        if (n.read)
          return n
        return {
          ...n,
          read: true,
          readAt,
        }
      })
      void updatedCount
    }
    catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    }
  }

  async function removeNotification(id: string) {
    try {
      await pickApi().remove(id)
      notifications.value = notifications.value.filter(n => n.id !== id)
    }
    catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    }
  }

  async function clearAll(type?: NotificationItem['type']) {
    try {
      await pickApi().clear(type)
      notifications.value = type
        ? notifications.value.filter(n => n.type !== type)
        : []
    }
    catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught))
    }
  }

  function reset() {
    notifications.value = []
    loading.value = false
    loaded.value = false
    error.value = null
  }

  return {
    notifications,
    loading,
    loaded,
    error,
    unreadCount,
    getByType,
    unreadByType,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    reset,
  }
})

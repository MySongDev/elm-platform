<script setup lang="ts">
import type { NotificationItem } from '@/entities/notification'
import {
  IconBell as IconEpBell,
  IconCheck as IconEpCheck,
  IconDelete as IconEpDelete,
} from '@iconify-prerendered/vue-ep'
import { useNotificationStore } from '@/entities/notification'
import TopNavigationAction from '../components/TopNavigationAction.vue'

defineOptions({ name: 'NotificationBell' })

const { t } = useI18n()
const notificationStore = useNotificationStore()
const activeType = ref<NotificationItem['type']>('notification')

const tabs: Array<{
  label: string
  value: NotificationItem['type']
}> = [
  {
    label: 'notification.message',
    value: 'notification',
  },
  {
    label: 'notification.message',
    value: 'message',
  },
  {
    label: 'notification.todo',
    value: 'todo',
  },
]

const currentList = computed(() => notificationStore.getByType(activeType.value))

function markAllRead() {
  notificationStore.markAllAsRead(activeType.value)
}

function clearCurrent() {
  notificationStore.clearAll(activeType.value)
}

onMounted(() => {
  notificationStore.loadMockData()
})
</script>

<template>
  <el-popover
    placement="bottom-end"
    width="360"
    trigger="click"
    popper-class="notification-popover"
  >
    <template #reference>
      <TopNavigationAction shape="circle" :aria-label="t('notification.title')">
        <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0" :max="99">
          <el-icon :size="18">
            <IconEpBell />
          </el-icon>
        </el-badge>
      </TopNavigationAction>
    </template>

    <div class="notification-panel">
      <div class="notification-panel__head">
        <strong>{{ t('notification.title') }}</strong>
        <div class="notification-panel__tools">
          <el-button
            link
            type="primary"
            :icon="IconEpCheck"
            @click="markAllRead"
          >
            {{ t('notification.markAllRead') }}
          </el-button>
          <el-button
            link
            type="danger"
            :icon="IconEpDelete"
            @click="clearCurrent"
          >
            {{ t('notification.clear') }}
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeType" stretch>
        <el-tab-pane
          v-for="item in tabs"
          :key="item.value"
          :label="`${t(item.label)} (${notificationStore.unreadByType(item.value)})`"
          :name="item.value"
        />
      </el-tabs>

      <div v-if="currentList.length" class="notification-list">
        <button
          v-for="item in currentList"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.read }"
          type="button"
          @click="notificationStore.markAsRead(item.id)"
        >
          <span class="notification-item__title">{{ item.title }}</span>
          <span class="notification-item__desc">{{ item.description || '-' }}</span>
          <span class="notification-item__time">{{ item.time }}</span>
        </button>
      </div>
      <el-empty v-else :description="t('notification.empty')" :image-size="72" />
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.notification-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-panel__tools {
  display: flex;
  gap: 8px;
}

.notification-list {
  max-height: 320px;
  overflow: auto;
}

.notification-item {
  display: grid;
  width: 100%;
  padding: 10px 4px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--app-border-light);
}

.notification-item.unread .notification-item__title {
  color: var(--el-color-primary);
}

.notification-item__title {
  font-weight: 600;
  color: var(--app-text-primary);
}

.notification-item__desc,
.notification-item__time {
  margin-top: 4px;
  font-size: 12px;
  color: var(--app-text-secondary);
}
</style>

<script setup lang="ts">
import { IconArrowDown as IconEpArrowDown } from '@iconify-prerendered/vue-ep'
import { useNotificationStore } from '@/entities/notification'
import { useAuthStore } from '@/entities/session'
import { useTabsStore } from '@/entities/tab'
import HoverDropdown from '../components/HoverDropdown.vue'
import TopNavigationAction from '../components/TopNavigationAction.vue'

defineOptions({ name: 'UserMenu' })

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const tabsStore = useTabsStore()
const notificationStore = useNotificationStore()

function handleAccountSettings() {
  router.push('/account/settings')
}

function handleLogout() {
  tabsStore.clearTabs()
  notificationStore.clearAll()
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <HoverDropdown>
    <TopNavigationAction class="user-entry" shape="pill">
      <span class="user-entry__avatar">
        {{ (authStore.userInfo?.username || 'A').slice(0, 1).toUpperCase() }}
      </span>
      <span class="user-entry__name">{{ authStore.userInfo?.username || 'Admin' }}</span>
      <el-icon>
        <IconEpArrowDown />
      </el-icon>
    </TopNavigationAction>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="handleAccountSettings">
          {{ t('header.accountSettings') }}
        </el-dropdown-item>
        <el-dropdown-item divided @click="handleLogout">
          {{ t('header.logout') }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </HoverDropdown>
</template>

<style scoped lang="scss">
.user-entry__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.user-entry__name {
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width <= 768px) {
  .user-entry__name {
    display: none;
  }
}
</style>

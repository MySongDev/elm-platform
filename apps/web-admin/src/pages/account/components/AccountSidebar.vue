<script setup lang="ts">
import type { AccountPane } from '../config'
import { IconArrowLeft as IconEpArrowLeft } from '@iconify-prerendered/vue-ep'
import { useAuthStore } from '@/entities/session'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'

defineOptions({ name: 'AccountSidebar' })

defineProps<{
  panes: AccountPane[]
  activeKey: string
}>()

const emit = defineEmits<{
  change: [key: string]
}>()

const router = useRouter()
const authStore = useAuthStore()

function backHome() {
  router.push(DEFAULT_HOME_PATH)
}
</script>

<template>
  <aside class="account-sidebar">
    <button class="back-button" type="button" @click="backHome">
      <el-icon>
        <IconEpArrowLeft />
      </el-icon>
      <span>{{ $t('common.back') }}</span>
    </button>

    <div class="account-user">
      <div class="account-user__avatar">
        {{ (authStore.userInfo?.username || 'A').slice(0, 1).toUpperCase() }}
      </div>
      <div class="account-user__meta">
        <strong>{{ authStore.userInfo?.username || 'Admin' }}</strong>
        <span>{{ authStore.userInfo?.role || $t('common.unknownRole') }}</span>
      </div>
    </div>

    <nav class="account-menu">
      <button v-for="pane in panes" :key="pane.key" type="button" class="account-menu__item"
        :class="{ active: pane.key === activeKey }" @click="emit('change', pane.key)">
        <SvgIcon :icon-name="pane.icon" />
        <span>{{ $t(pane.label) }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.account-sidebar {
  width: 240px;
  height: 100%;
  padding: 20px 16px;
  background: var(--app-bg-surface);
  border-right: 1px solid var(--app-border-light);
}

.back-button,
.account-menu__item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  color: var(--app-text-regular);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.back-button {
  gap: 6px;
  margin-bottom: 24px;
  font-size: 14px;
  transition: all 0.3s ease-in-out;
  transform-origin: center;
  will-change: transform;

  &:hover {
    font-size: 16px;
    transform: scale(1.1);
  }
}

.account-user {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 4px 20px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--app-border-light);
}

.account-user__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-weight: 600;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

.account-user__meta {
  display: grid;
  gap: 4px;

  span {
    font-size: 12px;
    color: var(--app-text-secondary);
  }
}

.account-menu {
  display: grid;
  gap: 4px;
}

.account-menu__item {
  gap: 10px;
  justify-content: flex-start;

  &.active,
  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}
</style>

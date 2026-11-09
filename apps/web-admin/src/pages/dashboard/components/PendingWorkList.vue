<script setup lang="ts">
import type { PendingWorkItem } from '../model/types'

defineOptions({ name: 'DashboardPendingWorkList' })

defineProps<{
  items: PendingWorkItem[]
}>()

const router = useRouter()
const { t } = useI18n()

function handleClick(item: PendingWorkItem) {
  if (!item.routeName)
    return
  router.push({ name: item.routeName })
}
</script>

<template>
  <el-card class="dashboard-panel" shadow="hover">
    <template #header>
      <span>{{ t('dashboard.pendingWork') }}</span>
    </template>

    <div class="dashboard-pending-list">
      <button
        v-for="item in items"
        :key="item.key"
        class="dashboard-pending-list__item"
        type="button"
        @click="handleClick(item)"
      >
        <span>{{ t(item.titleKey) }}</span>
        <el-badge :value="item.count" :max="99" />
      </button>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.dashboard-pending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-pending-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  color: var(--app-text-primary);
  cursor: pointer;
  background: var(--app-bg-page);
  border: 1px solid var(--app-border-light);
  border-radius: 8px;

  &:hover {
    color: var(--app-color-primary, #409eff);
    border-color: var(--app-color-primary, #409eff);
  }
}
</style>

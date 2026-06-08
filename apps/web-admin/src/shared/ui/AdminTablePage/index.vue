<script setup lang="ts">
import type { AdminEmptyReason, AdminSkeletonVariant } from '@/shared/ui/state'
import { IconRefresh as IconEpRefresh } from '@iconify-prerendered/vue-ep'
import { AdminStateView } from '@/shared/ui/state'

defineOptions({ name: 'AdminTablePage' })

withDefaults(defineProps<{
  title: string
  loading?: boolean
  error?: unknown | string
  empty?: boolean
  emptyReason?: AdminEmptyReason
  forbidden?: boolean
  skeleton?: AdminSkeletonVariant | false
}>(), {
  loading: false,
  error: undefined,
  empty: false,
  emptyReason: 'no-data',
  forbidden: false,
})

const emit = defineEmits<{
  refresh: []
  clearFilter: []
}>()
</script>

<template>
  <div class="admin-table-page">
    <div v-if="$slots.search" class="admin-table-page__search">
      <slot name="search" />
    </div>

    <div class="admin-table-page__bar">
      <div class="admin-table-page__title">
        {{ title }}
      </div>
      <div class="admin-table-page__actions">
        <slot name="buttons" />

        <el-button :icon="IconEpRefresh" :loading="loading" @click="emit('refresh')">
          {{ $t('common.refresh') }}
        </el-button>
      </div>
    </div>

    <div class="admin-table-page__body">
      <AdminStateView
        :loading="loading"
        :error="error"
        :empty="empty"
        :empty-reason="emptyReason"
        :forbidden="forbidden"
        :skeleton="skeleton ?? false"
        @retry="emit('refresh')"
        @clear-filter="emit('clearFilter')"
      >
        <slot />
      </AdminStateView>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-table-page {
  width: 100%;
}

.admin-table-page__search,
.admin-table-page__bar,
.admin-table-page__body {
  background: var(--app-bg-surface);
}

.admin-table-page__search {
  padding: 12px 24px 0;
  margin-bottom: 12px;
  overflow: auto;

  :deep(.el-form-item) {
    margin-bottom: var(--app-space-md);
  }
}

.admin-table-page__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid var(--app-border-light);
}

.admin-table-page__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.admin-table-page__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.admin-table-page__body {
  padding: var(--app-space-lg);
}
</style>

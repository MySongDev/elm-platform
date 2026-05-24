<script setup lang="ts">
import { IconRefresh as IconEpRefresh } from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'AdminTablePage' })

withDefaults(defineProps<{
  title: string
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  refresh: []
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
      <slot />
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

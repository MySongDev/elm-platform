<script setup lang="ts">
import type { AdminSkeletonVariant } from './model/state'

defineOptions({ name: 'AdminSkeleton' })

withDefaults(defineProps<{
  variant?: AdminSkeletonVariant
  rows?: number
}>(), {
  variant: 'table',
  rows: 4,
})
</script>

<template>
  <div class="admin-skeleton" :class="`admin-skeleton--${variant}`">
    <template v-if="variant === 'table'">
      <el-skeleton :rows="rows" animated />
    </template>

    <template v-else-if="variant === 'form'">
      <el-skeleton :rows="rows" animated />
    </template>

    <template v-else>
      <el-skeleton animated>
        <template #template>
          <div class="admin-skeleton__card-grid">
            <el-skeleton-item
              v-for="item in 4"
              :key="item"
              variant="rect"
              class="admin-skeleton__card"
            />
          </div>
        </template>
      </el-skeleton>
    </template>
  </div>
</template>

<style scoped lang="scss">
.admin-skeleton {
  width: 100%;
  padding: var(--app-space-lg);
  background: var(--app-bg-surface);
}

.admin-skeleton--table,
.admin-skeleton--form {
  border: 1px solid var(--app-border-light);
  border-radius: 8px;
}

.admin-skeleton__card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--app-space-md);
}

.admin-skeleton__card {
  height: 112px;
  border-radius: 8px;
}

@media (width <= 1200px) {
  .admin-skeleton__card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .admin-skeleton__card-grid {
    grid-template-columns: 1fr;
  }
}
</style>

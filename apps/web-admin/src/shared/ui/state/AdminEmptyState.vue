<script setup lang="ts">
import type { AdminEmptyReason } from './model/state'
import { IconDocument as IconEpDocument, IconSearch as IconEpSearch } from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'AdminEmptyState' })

const props = withDefaults(defineProps<{
  reason?: AdminEmptyReason
  description?: string
  actionText?: string
}>(), {
  reason: 'no-data',
  description: undefined,
  actionText: undefined,
})

const emit = defineEmits<{
  clearFilter: []
}>()

const { t } = useI18n()

const resolvedDescription = computed(() => {
  if (props.description)
    return props.description
  return props.reason === 'no-filter-result'
    ? t('state.empty.noFilterResult')
    : t('state.empty.noData')
})

const resolvedActionText = computed(() => props.actionText ?? t('state.empty.clearFilter'))
const iconComponent = computed(() => props.reason === 'no-filter-result' ? IconEpSearch : IconEpDocument)
</script>

<template>
  <div class="admin-empty-state">
    <el-empty :description="resolvedDescription">
      <template #image>
        <el-icon class="admin-empty-state__icon">
          <component :is="iconComponent" />
        </el-icon>
      </template>

      <slot name="actions">
        <el-button
          v-if="reason === 'no-filter-result'"
          type="primary"
          plain
          @click="emit('clearFilter')"
        >
          {{ resolvedActionText }}
        </el-button>
      </slot>
    </el-empty>
  </div>
</template>

<style scoped lang="scss">
.admin-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: var(--app-space-lg);
}

.admin-empty-state__icon {
  width: 72px;
  height: 72px;
  font-size: 56px;
  color: var(--app-text-placeholder);
  background: var(--app-bg-page);
  border-radius: 50%;
}
</style>

<script setup lang="ts">
import type { AdminEmptyReason, AdminSkeletonVariant } from './model/state'
import AdminEmptyState from './AdminEmptyState.vue'
import AdminErrorState from './AdminErrorState.vue'
import AdminForbiddenHint from './AdminForbiddenHint.vue'
import AdminSkeleton from './AdminSkeleton.vue'
import { resolveAdminStateKind } from './model/state'

defineOptions({ name: 'AdminStateView' })

const props = withDefaults(defineProps<{
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
  retry: []
  clearFilter: []
}>()

const stateKind = computed(() => resolveAdminStateKind({
  forbidden: props.forbidden,
  loading: props.loading,
  error: props.error,
  empty: props.empty,
}))

const shouldRenderSkeleton = computed(() => props.skeleton !== false)
const skeletonVariant = computed(() => props.skeleton || 'table')
</script>

<template>
  <div class="admin-state-view">
    <slot v-if="stateKind === 'forbidden'" name="forbidden">
      <AdminForbiddenHint />
    </slot>

    <slot v-else-if="stateKind === 'loading'" name="loading">
      <AdminSkeleton v-if="shouldRenderSkeleton" :variant="skeletonVariant" />
      <slot v-else />
    </slot>

    <slot
      v-else-if="stateKind === 'error'"
      name="error"
      :error="error"
      :retry="() => emit('retry')"
    >
      <AdminErrorState :error="error" @retry="emit('retry')" />
    </slot>

    <slot
      v-else-if="stateKind === 'empty'"
      name="empty"
      :reason="emptyReason"
      :clear-filter="() => emit('clearFilter')"
    >
      <AdminEmptyState :reason="emptyReason" @clear-filter="emit('clearFilter')" />
    </slot>

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { IconRefresh as IconEpRefresh, IconWarning as IconEpWarning } from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'AdminErrorState' })

const props = withDefaults(defineProps<{
  error?: unknown | string
  title?: string
  retryText?: string
}>(), {
  error: undefined,
  title: undefined,
  retryText: undefined,
})

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()

function normalizeErrorMessage(error: unknown) {
  if (!error)
    return t('state.error.description')
  if (typeof error === 'string')
    return error
  if (error instanceof Error)
    return error.message
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string')
      return message
  }
  return t('state.error.description')
}

const resolvedTitle = computed(() => props.title ?? t('state.error.title'))
const resolvedDescription = computed(() => normalizeErrorMessage(props.error))
const resolvedRetryText = computed(() => props.retryText ?? t('state.error.retry'))
</script>

<template>
  <div class="admin-error-state">
    <el-icon class="admin-error-state__icon">
      <IconEpWarning />
    </el-icon>
    <div class="admin-error-state__title">
      {{ resolvedTitle }}
    </div>
    <div class="admin-error-state__description">
      {{ resolvedDescription }}
    </div>
    <slot name="actions">
      <el-button type="primary" :icon="IconEpRefresh" @click="emit('retry')">
        {{ resolvedRetryText }}
      </el-button>
    </slot>
  </div>
</template>

<style scoped lang="scss">
.admin-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: var(--app-space-xl, 32px);
  text-align: center;
  background: var(--app-bg-surface);
}

.admin-error-state__icon {
  margin-bottom: var(--app-space-md);
  font-size: 56px;
  color: var(--app-color-danger, #f56c6c);
}

.admin-error-state__title {
  margin-bottom: var(--app-space-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.admin-error-state__description {
  max-width: 520px;
  margin-bottom: var(--app-space-lg);
  font-size: 14px;
  line-height: 1.6;
  color: var(--app-text-secondary);
}
</style>

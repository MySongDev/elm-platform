<script setup lang="ts">
import { IconLock as IconEpLock } from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'AdminForbiddenHint' })

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  compact?: boolean
}>(), {
  title: undefined,
  description: undefined,
  compact: false,
})

const { t } = useI18n()
const resolvedTitle = computed(() => props.title ?? t('state.forbidden.title'))
const resolvedDescription = computed(() => props.description ?? t('state.forbidden.description'))
</script>

<template>
  <el-alert
    class="admin-forbidden-hint"
    :class="{ 'admin-forbidden-hint--compact': compact }"
    type="warning"
    :closable="false"
    show-icon
  >
    <template #title>
      <span class="admin-forbidden-hint__title">
        <el-icon><IconEpLock /></el-icon>
        {{ resolvedTitle }}
      </span>
    </template>
    <template #default>
      {{ resolvedDescription }}
    </template>
  </el-alert>
</template>

<style scoped lang="scss">
.admin-forbidden-hint {
  margin-bottom: var(--app-space-md);
}

.admin-forbidden-hint--compact {
  margin-bottom: 0;
}

.admin-forbidden-hint__title {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
</style>

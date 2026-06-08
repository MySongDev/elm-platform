<script setup lang="ts">
import type { StatusTagConfig, WorkflowTagType } from '../model/types'

defineOptions({ name: 'StatusTag' })

const props = defineProps<{
  /** 当前状态值 */
  status: string
  /** 状态 → 标签配置映射 */
  statusMap: Record<string, StatusTagConfig>
  /** 是否显示圆点样式（适合表格内展示） */
  dot?: boolean
  /** 覆盖默认大小 */
  size?: 'small' | 'default' | 'large'
}>()

const tagConfig = computed(() => {
  return props.statusMap[props.status] || {
    label: props.status,
    type: 'info' as WorkflowTagType,
  }
})
</script>

<template>
  <el-tag
    :type="tagConfig.type || undefined"
    :size="size"
    :effect="dot ? 'plain' : 'light'"
    disable-transitions
  >
    <span v-if="dot" class="status-dot" :class="`status-dot--${tagConfig.type || 'info'}`" />
    {{ tagConfig.label }}
  </el-tag>
</template>

<style scoped>
.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  vertical-align: middle;
  border-radius: 50%;
}

.status-dot--success {
  background-color: var(--el-color-success);
}

.status-dot--warning {
  background-color: var(--el-color-warning);
}

.status-dot--danger {
  background-color: var(--el-color-danger);
}

.status-dot--info {
  background-color: var(--el-color-info);
}

.status-dot--primary {
  background-color: var(--el-color-primary);
}
</style>

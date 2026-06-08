<script setup lang="ts">
import type { ActionConfig, ActionVisibilityContext, WorkflowTagType } from '../model/types'
import { ElMessageBox } from 'element-plus'
import { getVisibleActions } from '../model/permissions'

defineOptions({ name: 'StateMachineActions' })

const props = defineProps<{
  /** 动作配置映射 */
  actionMap: Record<string, ActionConfig>
  /** 后端返回的可用动作列表 */
  availableActions: string[]
  /** 当前记录（传递给 visible 判断） */
  record: any
  /** 权限检查函数 */
  hasPermission: (permission: string) => boolean
  /** 按钮风格：link 链接按钮 / button 常规按钮 */
  buttonStyle?: 'link' | 'button'
}>()

const emit = defineEmits<{
  action: [action: string, record: any]
}>()

const { t } = useI18n()

const visibleActions = computed(() => {
  const context: ActionVisibilityContext = {
    availableActions: props.availableActions,
    hasPermission: props.hasPermission,
    record: props.record,
  }
  return getVisibleActions(props.actionMap, context)
})

function resolveLabel(label: string) {
  // 如果 label 包含 '.'，视为 i18n key，否则直接展示
  return label.includes('.') ? t(label) : label
}

type ButtonType = '' | 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'text'

function getButtonType(item: {
  type?: WorkflowTagType
  danger?: boolean
}): ButtonType {
  if (item.danger)
    return 'danger'
  return (item.type || 'primary') as ButtonType
}

function handleAction(action: string, item: ActionConfig) {
  if (item.confirmText) {
    ElMessageBox.confirm(
      resolveLabel(item.confirmText),
      { type: item.danger ? 'warning' : 'info' },
    ).then(() => {
      emit('action', action, props.record)
    }).catch(() => {})
  }
  else {
    emit('action', action, props.record)
  }
}
</script>

<template>
  <div class="state-machine-actions">
    <template v-for="item in visibleActions" :key="item.action">
      <el-button
        :link="buttonStyle !== 'button'"
        :type="getButtonType(item)"
        :size="buttonStyle === 'button' ? 'small' : undefined"
        @click="handleAction(item.action, item)"
      >
        {{ resolveLabel(item.label) }}
      </el-button>
    </template>
  </div>
</template>

<style scoped>
.state-machine-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: center;
}
</style>

<script setup lang="ts">
/**
 * @file 角色页面权限面板
 * @domain features/role-management
 * @description 以菜单树形式展示页面权限，父级勾选只作为批量选择，保存时交由父级提交。
 */

import type { RoleMenuPermissionNode } from '../model/permission-tree'
import type { RoleItem } from '@/entities/role'
import {
  IconCheck as IconEpCheck,
  IconClose as IconEpClose,
  IconSearch as IconEpSearch,
} from '@iconify-prerendered/vue-ep'

defineOptions({ name: 'RolePermissionPanel' })

const props = defineProps<{
  role: RoleItem | null
  treeData: RoleMenuPermissionNode[]
  checkedKeys: number[]
  saving: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [checkedKeys: number[]]
}>()

interface TreeInstance {
  filter: (value: string) => void
  getCheckedKeys: (leafOnly?: boolean) => Array<string | number>
  setCheckedKeys: (keys: number[]) => void
}

const visible = defineModel<boolean>('visible', { required: true })
const { t } = useI18n()
const treeRef = useTemplateRef<TreeInstance>('treeRef')
const searchValue = shallowRef('')
const expandAll = shallowRef(true)
const selectAll = shallowRef(false)
const renderKey = shallowRef(0)
const currentCheckedKeys = ref<number[]>([])

const treeProps = {
  label: 'title',
  children: 'children',
}

const allMenuIds = computed(() => collectMenuIds(props.treeData))
const checkedCount = computed(() => currentCheckedKeys.value.length)
const roleTitle = computed(() => props.role?.name ? `${t('role.menuPermissions')}（${props.role.name}）` : t('role.menuPermissions'))
const hasWildcardPermission = computed(() => props.role?.permissions.includes('*:*:*') ?? false)

watch(searchValue, value => treeRef.value?.filter(value))

watch(
  () => props.checkedKeys,
  (keys) => {
    currentCheckedKeys.value = [...keys]
    nextTick(() => treeRef.value?.setCheckedKeys(keys))
  },
  { immediate: true },
)

watch(
  () => visible.value,
  (isVisible) => {
    if (!isVisible)
      return

    searchValue.value = ''
    selectAll.value = false
    currentCheckedKeys.value = [...props.checkedKeys]
    nextTick(() => treeRef.value?.setCheckedKeys(props.checkedKeys))
  },
)

watch(expandAll, () => {
  renderKey.value += 1
  nextTick(() => treeRef.value?.setCheckedKeys(props.checkedKeys))
})

watch(selectAll, (checked) => {
  const nextKeys = checked ? allMenuIds.value : []
  currentCheckedKeys.value = nextKeys
  treeRef.value?.setCheckedKeys(nextKeys)
})

function closePanel() {
  visible.value = false
  emit('close')
}

function savePermissions() {
  syncCheckedKeys()
  emit('save', currentCheckedKeys.value)
}

function syncCheckedKeys() {
  currentCheckedKeys.value = treeRef.value?.getCheckedKeys(false).map(Number) ?? []
}

function filterNode(query: string, data: Record<string, unknown>) {
  if (!query)
    return true
  const title = String(data.title ?? '')
  const path = String(data.path ?? '')
  const permission = String(data.permission ?? '')
  return title.includes(query) || path.includes(query) || permission.includes(query)
}

function collectMenuIds(nodes: RoleMenuPermissionNode[]): number[] {
  return nodes.flatMap(node => [node.id, ...(node.children ? collectMenuIds(node.children) : [])])
}
</script>

<template>
  <aside
    class="role-permission-panel"
    :class="{ 'is-visible': visible, 'is-collapsed': !visible }"
    :aria-hidden="!visible"
  >
    <div class="role-permission-panel__inner">
      <header class="role-permission-panel__header">
        <div class="role-permission-panel__title">
          {{ roleTitle }}
        </div>
        <div class="role-permission-panel__actions">
          <el-tooltip :content="t('common.save')">
            <el-button
              type="primary"
              circle
              :icon="IconEpCheck"
              :loading="saving"
              :aria-label="t('common.save')"
              @click="savePermissions"
            />
          </el-tooltip>
          <el-tooltip :content="t('common.cancel')">
            <el-button
              circle
              :icon="IconEpClose"
              :aria-label="t('common.cancel')"
              @click="closePanel"
            />
          </el-tooltip>
        </div>
      </header>

      <el-alert
        v-if="hasWildcardPermission"
        class="role-permission-panel__notice"
        type="warning"
        :closable="false"
        show-icon
      >
        <span class="role-permission-panel__notice-text">
          {{ t('role.wildcardPermissionTip') }}
        </span>
      </el-alert>

      <el-input
        v-model="searchValue"
        class="role-permission-panel__search"
        :prefix-icon="IconEpSearch"
        :placeholder="t('role.permissionSearchPlaceholder')"
        clearable
      />

      <div class="role-permission-panel__toolbar">
        <el-checkbox v-model="expandAll">
          {{ t('role.expandAll') }}
        </el-checkbox>
        <el-checkbox v-model="selectAll">
          {{ t('role.selectAll') }}
        </el-checkbox>
        <span class="role-permission-panel__count">
          {{ t('role.checkedPageCount', { count: checkedCount }) }}
        </span>
      </div>

      <el-tree
        :key="renderKey"
        ref="treeRef"
        class="role-permission-panel__tree"
        node-key="id"
        show-checkbox
        :data="treeData"
        :props="treeProps"
        :default-expand-all="expandAll"
        :filter-node-method="filterNode"
        @check="syncCheckedKeys"
      >
        <template #default="{ data }">
          <span class="role-permission-panel__node">
            <span class="role-permission-panel__node-title">{{ data.title }}</span>
            <span v-if="data.permission" class="role-permission-panel__node-code">
              {{ data.permission }}
            </span>
          </span>
        </template>
      </el-tree>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.role-permission-panel {
  --role-permission-panel-width: clamp(400px, 34vw, 520px);

  display: flex;
  flex: 0 0 var(--role-permission-panel-width);
  flex-direction: column;
  width: var(--role-permission-panel-width);
  min-width: 0;
  max-width: var(--role-permission-panel-width);
  max-height: calc(100vh - 116px);
  margin-left: var(--app-space-md);
  overflow: clip;
  background: var(--app-bg-surface);
  border-left: 1px solid var(--app-border-light);
  transition:
    flex-basis 240ms cubic-bezier(0.4, 0, 0.2, 1),
    width 240ms cubic-bezier(0.4, 0, 0.2, 1),
    max-width 240ms cubic-bezier(0.4, 0, 0.2, 1),
    margin-left 240ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 180ms ease,
    border-color 180ms ease;
}

@supports not (overflow: clip) {
  .role-permission-panel {
    overflow: hidden;
  }
}

.role-permission-panel.is-collapsed {
  flex-basis: 0;
  width: 0;
  max-width: 0;
  margin-left: 0;
  pointer-events: none;
  border-left-color: transparent;
  opacity: 0;
}

.role-permission-panel__inner {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: var(--role-permission-panel-width);
  min-width: var(--role-permission-panel-width);
  max-width: var(--role-permission-panel-width);
  min-height: 0;
  overflow: hidden;
}

.role-permission-panel__header {
  display: flex;
  gap: var(--app-space-md);
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 var(--app-space-md);
  border-bottom: 1px solid var(--app-border-light);
}

.role-permission-panel__title {
  min-width: 0;
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-permission-panel__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.role-permission-panel__notice,
.role-permission-panel__search,
.role-permission-panel__toolbar {
  margin: var(--app-space-md) var(--app-space-md) 0;
}

.role-permission-panel__notice {
  align-items: flex-start;
}

.role-permission-panel__notice :deep(.el-alert__content) {
  min-width: 0;
}

.role-permission-panel__notice-text {
  display: block;
  line-height: 1.6;
  white-space: normal;
}

.role-permission-panel__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
}

.role-permission-panel__count {
  margin-left: auto;
  font-size: 13px;
  color: var(--app-text-secondary);
}

.role-permission-panel__tree {
  flex: 1;
  padding: var(--app-space-sm) var(--app-space-md) var(--app-space-md);
  margin-top: var(--app-space-sm);
  overflow: auto;
}

.role-permission-panel__node {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.role-permission-panel__node-title {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-permission-panel__node-code {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--app-text-secondary);
}

@media (width <= 960px) {
  .role-permission-panel {
    flex-basis: auto;
    width: 100%;
    min-width: 0;
    max-width: none;
    max-height: none;
    margin-top: var(--app-space-md);
    margin-left: 0;
    border-top: 1px solid var(--app-border-light);
    border-left: 0;
  }

  .role-permission-panel.is-collapsed {
    flex-basis: auto;
    width: 100%;
    max-width: none;
    max-height: 0;
    margin-top: 0;
  }

  .role-permission-panel__inner {
    width: 100%;
    min-width: 0;
    max-width: none;
  }
}
</style>

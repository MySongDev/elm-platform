<script setup lang="ts">
/**
 * @file 角色页面权限面板
 * @domain pages/system/role
 * @description 有副作用：加载并保存角色页面权限，维护树交互和面板动画。
 */

import type { RoleMenuPermissionNode } from '../model/permission-tree'
import type { RoleItem } from '../model/types'
import {
  IconCheck as IconEpCheck,
  IconClose as IconEpClose,
  IconSearch as IconEpSearch,
} from '@iconify-prerendered/vue-ep'
import { computed, nextTick, onScopeDispose, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRolePermissions } from '../model/useRolePermissions'

defineOptions({ name: 'RolePermissionPanel' })

const props = defineProps<{
  role: RoleItem | null
}>()

const emit = defineEmits<{
  saved: []
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
let restoreVersion = 0
const {
  selectedRole,
  checkedMenuIds,
  permissionPanelRendered,
  permissionPanelVisible,
  menuPermissionTree,
  loading,
  loadError,
  menuReady,
  savingPermissions,
  saveError,
  fetchMenuTree,
  openPermissionPanel,
  closePermissionPanel,
  saveMenuPermissions,
} = useRolePermissions(() => emit('saved'))
const treeDisabled = computed(() => savingPermissions.value || loading.value || !menuReady.value)
const treeProps = computed(() => ({
  label: 'title',
  children: 'children',
  disabled: () => treeDisabled.value,
}))

const allMenuIds = computed(() => collectMenuIds(menuPermissionTree.value))
const checkedCount = computed(() => currentCheckedKeys.value.length)
const roleTitle = computed(() => selectedRole.value?.name
  ? `${t('role.menuPermissions')}（${selectedRole.value.name}）`
  : t('role.menuPermissions'))
const hasWildcardPermission = computed(() => selectedRole.value?.permissions.includes('*:*:*') ?? false)

watch(searchValue, value => treeRef.value?.filter(value))

watch([
  visible,
  () => props.role,
], ([open, role]) => {
  restoreVersion++
  if (open && role) {
    searchValue.value = ''
    selectAll.value = false
    currentCheckedKeys.value = []
    void openPermissionPanel(role)
  }
  else if (permissionPanelRendered.value) {
    closePermissionPanel()
  }
}, {
  immediate: true,
  flush: 'sync',
})

watch(checkedMenuIds, (keys) => {
  currentCheckedKeys.value = [...keys]
  void restoreTreeChecks()
})

watch(expandAll, () => {
  renderKey.value += 1
})

watch([renderKey, permissionPanelRendered], () => {
  void restoreTreeChecks()
})

async function restoreTreeChecks() {
  const version = ++restoreVersion
  await nextTick()
  if (version !== restoreVersion)
    return
  // 展开开关会重建树，必须恢复未保存的当前勾选，不能退回角色原始权限。
  treeRef.value?.setCheckedKeys(currentCheckedKeys.value)
  treeRef.value?.filter(searchValue.value)
}

function toggleSelectAll(checked: boolean | string | number) {
  if (treeDisabled.value)
    return
  const nextKeys = checked
    ? allMenuIds.value
    : []
  currentCheckedKeys.value = nextKeys
  treeRef.value?.setCheckedKeys(nextKeys)
}

function closePanel() {
  if (savingPermissions.value)
    return
  visible.value = false
}

function savePermissions() {
  if (treeDisabled.value)
    return
  syncCheckedKeys()
  void saveMenuPermissions(currentCheckedKeys.value)
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
  return nodes.flatMap(node => [
    node.id,
    ...(node.children
      ? collectMenuIds(node.children)
      : []),
  ])
}

onScopeDispose(() => {
  restoreVersion++
})
</script>

<template>
  <aside
    v-if="permissionPanelRendered"
    class="role-permission-panel"
    :class="{ 'is-visible': permissionPanelVisible, 'is-collapsed': !permissionPanelVisible }"
    :aria-hidden="!permissionPanelVisible"
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
              :loading="savingPermissions"
              :disabled="loading || !menuReady"
              :aria-label="t('common.save')"
              @click="savePermissions"
            />
          </el-tooltip>
          <el-tooltip :content="t('common.cancel')">
            <el-button
              circle
              :icon="IconEpClose"
              :disabled="savingPermissions"
              :aria-label="t('common.cancel')"
              @click="closePanel"
            />
          </el-tooltip>
        </div>
      </header>

      <el-alert
        v-if="loadError"
        class="role-permission-panel__notice"
        type="error"
        :closable="false"
        :title="t('state.error.title')"
        show-icon
      >
        <el-button
          link
          type="primary"
          @click="fetchMenuTree()"
        >
          {{ t('state.error.retry') }}
        </el-button>
      </el-alert>
      <el-alert
        v-if="saveError"
        class="role-permission-panel__notice"
        type="error"
        :closable="false"
        :title="t('crud.saveFailed')"
        show-icon
      />

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
        <el-checkbox
          v-model="expandAll"
          :disabled="treeDisabled"
        >
          {{ t('role.expandAll') }}
        </el-checkbox>
        <el-checkbox
          v-model="selectAll"
          :disabled="treeDisabled"
          @change="toggleSelectAll"
        >
          {{ t('role.selectAll') }}
        </el-checkbox>
        <span class="role-permission-panel__count">
          {{ t('role.checkedPageCount', { count: checkedCount }) }}
        </span>
      </div>

      <el-tree
        :key="renderKey"
        ref="treeRef"
        v-loading="loading"
        class="role-permission-panel__tree"
        node-key="id"
        show-checkbox
        :data="menuPermissionTree"
        :props="treeProps"
        :default-expand-all="expandAll"
        :filter-node-method="filterNode"
        @check="syncCheckedKeys"
      >
        <template #default="{ data }">
          <span class="role-permission-panel__node">
            <span class="role-permission-panel__node-title">{{ data.title }}</span>
            <span
              v-if="data.permission"
              class="role-permission-panel__node-code"
            >
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
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
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

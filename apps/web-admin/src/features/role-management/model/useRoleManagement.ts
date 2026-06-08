/**
 * @file 角色管理组合式状态
 * @domain features/role-management
 * @description 聚合角色 CRUD、按钮权限选项和表单校验，是角色管理页面的业务状态边界。
 */

import type { FormRules } from 'element-plus'
import type { ButtonPermission } from '@/entities/permission'
import type { RoleItem } from '@/entities/role'
import type { MenuItem } from '@/entities/system-menu'
import { onScopeDispose } from 'vue'
import { getButtonPermissions } from '@/entities/permission'
import { createRole, deleteRole, getRoles, updateRole } from '@/entities/role'
import { getMenus } from '@/entities/system-menu'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'
import {
  collectMenuPermissionCodes,
  createRoleMenuPermissionTree,
  mergeRoleMenuPermissions,
  resolveCheckedMenuIdsByPermissions,
  resolveSelectedMenuPermissionCodes,
} from './permission-tree'

interface RoleQuery {
  name: string
  code: string
  status: string
}

export interface RoleFormState {
  id: number
  name: string
  code: string
  status: number
  remark: string
  permissions: string[]
}

const defaultForm: RoleFormState = {
  id: 0,
  name: '',
  code: '',
  status: 1,
  remark: '',
  permissions: [],
}

const PERMISSION_PANEL_TRANSITION_MS = 240
const PERMISSION_PANEL_ENTER_DELAY_MS = 20

/**
 * @description 有副作用：调用角色和按钮权限接口，维护角色表格/表单状态，并通过 CRUD feedback 触发确认与提示。
 * @returns 角色管理页面使用的 CRUD 状态、权限选项、校验规则和操作函数。
 */
export function useRoleManagement() {
  const { t } = useI18n()
  const permissionOptions = ref<ButtonPermission[]>([])
  const menuSource = ref<MenuItem[]>([])
  const permissionPanelRendered = shallowRef(false)
  const permissionPanelVisible = shallowRef(false)
  const selectedRole = shallowRef<RoleItem | null>(null)
  const checkedMenuIds = ref<number[]>([])
  const savingPermissions = shallowRef(false)
  const feedback = createElementPlusCrudFeedback()
  let openPanelTimer: ReturnType<typeof setTimeout> | null = null
  let closePanelTimer: ReturnType<typeof setTimeout> | null = null

  const crud = useConfigCrud<RoleItem, RoleQuery, RoleFormState, Partial<RoleItem>>({
    getDefaultQuery: () => ({
      name: '',
      code: '',
      status: '',
    }),
    getDefaultForm: () => ({
      ...defaultForm,
      permissions: [],
    }),
    fetchList: getRoles,
    createItem: createRole,
    updateItem: updateRole,
    deleteItem: deleteRole,
    getFormId: form => form.id,
    getRowId: row => row.id,
    filterItem: (item, query) => {
      const nameMatched = !query.name || item.name.includes(query.name)
      const codeMatched = !query.code || item.code.includes(query.code)
      const statusMatched = query.status === '' || String(item.status) === query.status
      return nameMatched && codeMatched && statusMatched
    },
    toForm: row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      status: row.status,
      remark: row.remark || '',
      permissions: [...row.permissions],
    }),
    deleteConfirm: row => t('role.deleteConfirm', { name: row.name }),
    saveSuccessMessage: t('crud.saveSuccess'),
    deleteSuccessMessage: t('crud.deleteSuccess'),
    feedback,
  })

  const menuPermissionTree = computed(() => createRoleMenuPermissionTree(menuSource.value))

  const rules: FormRules = {
    name: [{
      required: true,
      message: t('role.nameRequired'),
      trigger: 'blur',
    }],
    code: [{
      required: true,
      message: t('role.codeRequired'),
      trigger: 'blur',
    }],
  }

  async function fetchPermissionOptions() {
    permissionOptions.value = await getButtonPermissions().catch(() => [])
  }

  async function fetchMenuTree() {
    menuSource.value = await getMenus().catch(() => [])
  }

  async function openPermissionPanel(row: RoleItem) {
    clearClosePanelTimer()
    clearOpenPanelTimer()

    if (!menuSource.value.length)
      await fetchMenuTree()

    selectedRole.value = row
    checkedMenuIds.value = resolveCheckedMenuIdsByPermissions(menuPermissionTree.value, row.permissions)
    permissionPanelRendered.value = true

    if (permissionPanelVisible.value)
      return

    permissionPanelVisible.value = false
    openPanelTimer = setTimeout(() => {
      openPanelTimer = null

      if (!permissionPanelRendered.value)
        return

      permissionPanelVisible.value = true
    }, PERMISSION_PANEL_ENTER_DELAY_MS)
  }

  function closePermissionPanel() {
    clearOpenPanelTimer()
    clearClosePanelTimer()
    permissionPanelVisible.value = false
    closePanelTimer = setTimeout(() => {
      if (permissionPanelVisible.value)
        return

      permissionPanelRendered.value = false
      selectedRole.value = null
      checkedMenuIds.value = []
      closePanelTimer = null
    }, PERMISSION_PANEL_TRANSITION_MS)
  }

  function clearOpenPanelTimer() {
    if (!openPanelTimer)
      return

    clearTimeout(openPanelTimer)
    openPanelTimer = null
  }

  function clearClosePanelTimer() {
    if (!closePanelTimer)
      return

    clearTimeout(closePanelTimer)
    closePanelTimer = null
  }

  async function saveMenuPermissions(menuIds: number[]) {
    if (!selectedRole.value)
      return

    savingPermissions.value = true
    try {
      const role = selectedRole.value
      const selectedMenuPermissionCodes = resolveSelectedMenuPermissionCodes(menuPermissionTree.value, menuIds)
      const menuPermissionCodes = collectMenuPermissionCodes(menuPermissionTree.value)
      const permissions = mergeRoleMenuPermissions(
        role.permissions,
        selectedMenuPermissionCodes,
        menuPermissionCodes,
      )

      await updateRole(role.id, { permissions })
      role.permissions = permissions
      checkedMenuIds.value = resolveCheckedMenuIdsByPermissions(menuPermissionTree.value, permissions)
      feedback.notifySaveSuccess?.(t('role.permissionSaveSuccess'))
      await crud.fetchRows()
    }
    finally {
      savingPermissions.value = false
    }
  }

  onScopeDispose(() => {
    clearOpenPanelTimer()
    clearClosePanelTimer()
  })

  return {
    ...crud,
    permissionOptions,
    menuPermissionTree,
    permissionPanelRendered,
    permissionPanelVisible,
    selectedRole,
    checkedMenuIds,
    savingPermissions,
    rules,
    fetchRoles: crud.fetchRows,
    fetchPermissionOptions,
    fetchMenuTree,
    openPermissionPanel,
    closePermissionPanel,
    saveMenuPermissions,
  }
}

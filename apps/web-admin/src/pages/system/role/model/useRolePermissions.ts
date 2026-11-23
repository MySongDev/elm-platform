/**
 * @file 角色页面权限状态
 * @domain pages/system/role
 * @description 有副作用：加载权限树、恢复勾选、合并保存权限并维护面板过渡。
 */

import type { RoleItem } from './types'
import type { MenuItem } from '@/entities/system-menu'
import { ElMessage } from 'element-plus'
import { computed, onScopeDispose, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMenus } from '@/entities/system-menu'
import { updateRole } from '../api'
import {
  collectMenuPermissionCodes,
  createRoleMenuPermissionTree,
  mergeRoleMenuPermissions,
  resolveCheckedMenuIdsByPermissions,
  resolveSelectedMenuPermissionCodes,
} from './permission-tree'

export function useRolePermissions(onSaved: () => void = () => {}) {
  const { t } = useI18n()
  const menuSource = shallowRef<MenuItem[]>([])
  const selectedRole = shallowRef<RoleItem | null>(null)
  const checkedMenuIds = shallowRef<number[]>([])
  const permissionPanelRendered = shallowRef(false)
  const permissionPanelVisible = shallowRef(false)
  const loading = shallowRef(false)
  const loadError = shallowRef(false)
  const menuReady = shallowRef(false)
  const savingPermissions = shallowRef(false)
  const saveError = shallowRef(false)
  const menuPermissionTree = computed(() => createRoleMenuPermissionTree(menuSource.value))
  let sessionVersion = 0
  let loadVersion = 0
  let sessionOpen = false
  let disposed = false
  let openPanelTimer: ReturnType<typeof setTimeout> | null = null
  let closePanelTimer: ReturnType<typeof setTimeout> | null = null

  function clearPanelTimers() {
    if (openPanelTimer !== null)
      clearTimeout(openPanelTimer)
    if (closePanelTimer !== null)
      clearTimeout(closePanelTimer)
    openPanelTimer = null
    closePanelTimer = null
  }

  async function fetchMenuTree() {
    if (disposed)
      return
    const version = ++loadVersion
    const session = sessionVersion
    loading.value = true
    menuReady.value = false
    loadError.value = false
    try {
      const menus = await getMenus()
      // 切换角色、关闭或重试后，旧树不能恢复旧角色勾选或解除新请求的忙碌状态。
      if (version !== loadVersion || session !== sessionVersion)
        return
      menuSource.value = menus
      menuReady.value = true
      checkedMenuIds.value = resolveCheckedMenuIdsByPermissions(
        menuPermissionTree.value,
        selectedRole.value?.permissions ?? [],
      )
    }
    catch {
      if (version === loadVersion && session === sessionVersion)
        loadError.value = true
    }
    finally {
      if (version === loadVersion && session === sessionVersion)
        loading.value = false
    }
  }

  async function openPermissionPanel(role: RoleItem) {
    if (disposed)
      return
    clearPanelTimers()
    const session = ++sessionVersion
    sessionOpen = true
    selectedRole.value = {
      ...role,
      permissions: [...role.permissions],
    }
    checkedMenuIds.value = []
    savingPermissions.value = false
    saveError.value = false
    menuSource.value = []
    permissionPanelRendered.value = true
    if (!permissionPanelVisible.value) {
      // 先挂载收起状态，20ms 后展开；直接同时挂载和展开会跳过既有入场动画。
      openPanelTimer = setTimeout(() => {
        openPanelTimer = null
        if (session === sessionVersion && sessionOpen)
          permissionPanelVisible.value = true
      }, 20)
    }
    await fetchMenuTree()
  }

  function closePermissionPanel() {
    clearPanelTimers()
    sessionVersion++
    loadVersion++
    sessionOpen = false
    permissionPanelVisible.value = false
    loading.value = false
    savingPermissions.value = false
    // 离场动画需要保留角色标题和树；240ms 后再移除内容。
    closePanelTimer = setTimeout(() => {
      closePanelTimer = null
      permissionPanelRendered.value = false
      selectedRole.value = null
      checkedMenuIds.value = []
    }, 240)
  }

  async function saveMenuPermissions(menuIds: number[]) {
    if (!sessionOpen || !selectedRole.value || savingPermissions.value || !menuReady.value || loading.value)
      return
    const session = sessionVersion
    const role = selectedRole.value
    const permissions = mergeRoleMenuPermissions(
      role.permissions,
      resolveSelectedMenuPermissionCodes(menuPermissionTree.value, menuIds),
      collectMenuPermissionCodes(menuPermissionTree.value),
    )
    savingPermissions.value = true
    saveError.value = false
    try {
      await updateRole(role.id, { permissions })
      // 只更新这次打开的独立角色副本，旧保存不能修改后来打开的角色或发送旧 saved。
      if (session !== sessionVersion)
        return
      selectedRole.value = {
        ...role,
        permissions,
      }
      checkedMenuIds.value = resolveCheckedMenuIdsByPermissions(menuPermissionTree.value, permissions)
      ElMessage.success(t('role.permissionSaveSuccess'))
      onSaved()
    }
    catch {
      if (session === sessionVersion)
        saveError.value = true
    }
    finally {
      if (session === sessionVersion)
        savingPermissions.value = false
    }
  }

  onScopeDispose(() => {
    disposed = true
    sessionVersion++
    loadVersion++
    clearPanelTimers()
  })

  return {
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
  }
}

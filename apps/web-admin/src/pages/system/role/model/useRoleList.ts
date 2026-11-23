/**
 * @file 角色列表状态
 * @domain pages/system/role
 * @description 有副作用：加载、筛选和删除角色，维护列表错误。
 */

import type { RoleItem } from './types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteRole, getRoles } from '../api'

export function useRoleList() {
  const { t } = useI18n()
  const roles = shallowRef<RoleItem[]>([])
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const query = reactive({
    name: '',
    code: '',
    status: '',
  })
  let fetchVersion = 0
  let deleting = false
  let disposed = false

  const filteredData = computed(() => roles.value.filter(role => (
    (!query.name || role.name.includes(query.name))
    && (!query.code || role.code.includes(query.code))
    && (!query.status || role.status === query.status)
  )))

  async function fetchRoles() {
    if (disposed)
      return
    const version = ++fetchVersion
    loading.value = true
    error.value = null
    try {
      const result = await getRoles()
      // 刷新和销毁都会换版本，旧响应不能覆盖新列表或清掉新请求的 loading。
      if (version === fetchVersion)
        roles.value = result
    }
    catch (caughtError) {
      if (version === fetchVersion)
        error.value = caughtError
    }
    finally {
      if (version === fetchVersion)
        loading.value = false
    }
  }

  function resetQuery() {
    Object.assign(query, {
      name: '',
      code: '',
      status: '',
    })
  }

  async function handleDelete(role: RoleItem) {
    if (deleting || disposed)
      return
    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('role.deleteConfirm', { name: role.name }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed || disposed)
        return
      await deleteRole(role.id)
      if (disposed)
        return
      ElMessage.success(t('crud.deleteSuccess'))
      await fetchRoles()
    }
    catch {
      // 删除失败由共享 HTTP 提示，保留当前列表供重试。
    }
    finally {
      deleting = false
    }
  }

  onScopeDispose(() => {
    disposed = true
    fetchVersion++
  })

  return {
    loading,
    error,
    query,
    filteredData,
    resetQuery,
    fetchRoles,
    handleDelete,
  }
}

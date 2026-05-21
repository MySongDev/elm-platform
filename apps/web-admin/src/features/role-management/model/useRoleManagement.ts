/**
 * @file 角色管理组合式状态
 * @domain features/role-management
 * @description 聚合角色 CRUD、按钮权限选项和表单校验，是角色管理页面的业务状态边界。
 */

import type { FormRules } from 'element-plus'
import type { ButtonPermission } from '@/entities/permission'
import type { RoleItem } from '@/entities/role'
import { getButtonPermissions } from '@/entities/permission'
import { createRole, deleteRole, getRoles, updateRole } from '@/entities/role'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'

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

/**
 * @description 有副作用：调用角色和按钮权限接口，维护角色表格/表单状态，并通过 CRUD feedback 触发确认与提示。
 * @returns 角色管理页面使用的 CRUD 状态、权限选项、校验规则和操作函数。
 */
export function useRoleManagement() {
  const { t } = useI18n()
  const permissionOptions = ref<ButtonPermission[]>([])
  const crud = useConfigCrud<RoleItem, RoleQuery, RoleFormState, Partial<RoleItem>>({
    getDefaultQuery: () => ({ name: '', code: '', status: '' }),
    getDefaultForm: () => ({ ...defaultForm, permissions: [] }),
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
    feedback: createElementPlusCrudFeedback(),
  })

  const rules: FormRules = {
    name: [{ required: true, message: t('role.nameRequired'), trigger: 'blur' }],
    code: [{ required: true, message: t('role.codeRequired'), trigger: 'blur' }],
  }

  async function fetchPermissionOptions() {
    permissionOptions.value = await getButtonPermissions().catch(() => [])
  }

  return {
    ...crud,
    permissionOptions,
    rules,
    fetchRoles: crud.fetchRows,
    fetchPermissionOptions,
  }
}

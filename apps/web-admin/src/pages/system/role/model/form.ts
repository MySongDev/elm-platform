/**
 * @file 角色编辑草稿与载荷转换
 * @domain pages/system/role
 * @description 创建独立角色草稿，只提交基本信息和权限字段。
 */

import type { RoleItem } from './types'

export interface RoleFormState {
  name: RoleItem['name']
  code: RoleItem['code']
  status: RoleItem['status']
  remark: string
  permissions: RoleItem['permissions']
}

export type RoleFormPayload = Pick<RoleItem, 'name' | 'code' | 'status' | 'remark' | 'permissions'>

/** 权限数组必须复制，取消编辑不能留下已被草稿改写的列表行。 */
export function createRoleForm(role: RoleItem | null = null): RoleFormState {
  return {
    name: role?.name ?? '',
    code: role?.code ?? '',
    status: role?.status ?? 'ACTIVE',
    remark: role?.remark ?? '',
    permissions: [
      ...(role?.permissions ?? []),
    ],
  }
}

export function toRolePayload(form: RoleFormState): RoleFormPayload {
  return {
    name: form.name,
    code: form.code,
    status: form.status,
    remark: form.remark,
    permissions: [...form.permissions],
  }
}

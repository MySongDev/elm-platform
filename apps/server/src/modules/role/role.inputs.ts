import type { AccountStatus } from '../../common/constants/account-status'

/** 对应 RoleService 的角色新增/编辑输入（字段与 UpsertRoleDto 一一对应）。 */
export interface RoleUpsertInput {
  id?: number
  name?: string
  code?: string
  status?: AccountStatus
  remark?: string
  permissions?: string[]
}

/**
 * @file 部门编辑草稿与载荷转换
 * @domain pages/system/dept
 * @description 创建独立部门草稿，并明确提交可编辑字段。
 */

import type { DeptItem } from './types'
import type { AccountStatus } from '@/shared/lib/admin-display'

export interface DeptFormState {
  parentId: number | null
  name: string
  leader: string
  phone: string
  email: string
  sort: number
  status: AccountStatus
}

export type DeptPayload = Pick<DeptItem, 'parentId' | 'name' | 'leader' | 'phone' | 'email' | 'sort' | 'status'>

/** 编辑根部门时 null 就是原上级，不能被新增子部门的预设上级替换。 */
export function createDeptForm(dept: DeptItem | null = null, initialParentId: number | null = null): DeptFormState {
  return {
    parentId: dept ? dept.parentId : initialParentId,
    name: dept?.name ?? '',
    leader: dept?.leader || '',
    phone: dept?.phone || '',
    email: dept?.email || '',
    sort: dept?.sort ?? 0,
    status: dept?.status ?? 'ACTIVE',
  }
}

export function toDeptPayload(form: DeptFormState): DeptPayload {
  return {
    parentId: form.parentId,
    name: form.name,
    leader: form.leader,
    phone: form.phone,
    email: form.email,
    sort: form.sort,
    status: form.status,
  }
}

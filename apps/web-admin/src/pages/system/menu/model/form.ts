/**
 * @file 菜单编辑草稿与载荷转换
 * @domain pages/system/menu
 * @description 创建独立菜单草稿，并明确菜单创建和更新可提交的字段。
 */

import type { MenuItem } from '@/entities/system-menu'
import type { AccountStatus } from '@/shared/lib/admin-display'

export interface MenuFormState {
  parentId: number | null
  title: string
  path: string
  name: string
  icon: string
  permission: string
  type: 'catalog' | 'menu' | 'button'
  sort: number
  status: AccountStatus
}

/** 编辑保留菜单自己的父级，initialParentId 只用于「新增子菜单」的初始值。 */
export function createMenuForm(menu: MenuItem | null = null, initialParentId: number | null = null): MenuFormState {
  return {
    parentId: menu ? menu.parentId : initialParentId,
    title: menu?.title ?? '',
    path: menu?.path ?? '',
    name: menu?.name ?? '',
    icon: menu?.icon ?? '',
    permission: menu?.permission ?? '',
    type: menu?.type ?? 'menu',
    sort: menu?.sort ?? 0,
    status: menu?.status ?? 'ACTIVE',
  }
}

/** 接口身份由选中的菜单提供，载荷不携带列表行的 id 或 children。 */
export function toMenuPayload(form: MenuFormState) {
  return {
    parentId: form.parentId,
    title: form.title,
    path: form.path,
    name: form.name,
    icon: form.icon,
    permission: form.permission,
    type: form.type,
    sort: form.sort,
    status: form.status,
  }
}

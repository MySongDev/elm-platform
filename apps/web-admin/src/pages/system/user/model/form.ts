/**
 * @file 用户编辑草稿与载荷转换
 * @domain pages/system/user
 * @description 创建独立表单草稿，并分别生成类型明确的创建与更新参数。
 */

import type { CreateUserParams, UpdateUserParams, UserInfo } from '@/entities/user'

export interface UserFormState {
  username: string
  password: string
  email: string
  phone: string
  role: UserInfo['role']
  status: UserInfo['status']
  permissions: string[]
  tenantId: number | null
  dataScope: string
  boundShopIds: string[]
}

/** 编辑草稿必须复制数组，否则修改权限或店铺会直接改变列表行，取消编辑也无法还原。 */
export function createUserForm(user: UserInfo | null = null): UserFormState {
  return {
    username: user?.username ?? '',
    password: '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: user?.role ?? 'user',
    status: user?.status ?? 'ACTIVE',
    permissions: [
      ...(user?.permissions ?? []),
    ],
    tenantId: user?.tenant?.id ?? null,
    dataScope: user?.dataScope || 'ALL',
    boundShopIds: [
      ...(user?.boundShopIds ?? []),
    ],
  }
}

function getUserFields(form: UserFormState) {
  return {
    username: form.username,
    role: form.role,
    status: form.status,
    permissions: [...form.permissions],
    tenantId: form.dataScope === 'ALL'
      ? null
      : form.tenantId,
    dataScope: form.dataScope,
    boundShopIds: form.dataScope === 'SHOP'
      ? [...form.boundShopIds]
      : [],
  }
}

export function toCreateUserParams(form: UserFormState): CreateUserParams {
  return {
    ...getUserFields(form),
    password: form.password,
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
  }
}

/** 更新留空联系方式用 null；undefined 会被 JSON 省略，后端收不到清空操作。 */
export function toUpdateUserParams(form: UserFormState): UpdateUserParams {
  return {
    ...getUserFields(form),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
  }
}

import type { AccountStatus } from '../../common/constants/account-status'

export interface UserCreateInput {
  username: string
  password: string
  email?: string
  phone?: string
  role?: 'admin' | 'user' | 'tenant_admin' | 'shop_operator'
  status?: AccountStatus
  permissions?: string[]
  tenantId?: number | null
  dataScope?: 'ALL' | 'TENANT' | 'SHOP'
  boundShopIds?: string[]
}

export interface UserUpdateInput {
  username?: string
  email?: string
  phone?: string
  role?: 'admin' | 'user' | 'tenant_admin' | 'shop_operator'
  status?: AccountStatus
  permissions?: string[]
  tenantId?: number | null
  dataScope?: 'ALL' | 'TENANT' | 'SHOP'
  boundShopIds?: string[]
}

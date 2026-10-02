import type { Role } from '@/shared/config/access'
import type { AccountStatus } from '@/shared/lib/admin-display'

export interface UserTenantInfo {
  id: number
  code: string
  name: string
  status: string
}

export interface UserInfo {
  id: number
  username: string
  email: string | null
  phone: string | null
  avatar: string | null
  status: AccountStatus
  role: Role
  permissions: string[]
  tenant?: UserTenantInfo | null
  dataScope?: string
  boundShopIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserParams {
  username: string
  password: string
  email?: string
  phone?: string
  role?: Role
  status?: AccountStatus
  permissions?: string[]
  tenantId?: number | null
  dataScope?: string
  boundShopIds?: string[]
}

export interface UpdateUserParams {
  username?: string
  email?: string | null
  phone?: string | null
  status?: AccountStatus
  role?: Role
  permissions?: string[]
  tenantId?: number | null
  dataScope?: string
  boundShopIds?: string[]
}

export interface UserListQuery {
  username: string
  role: '' | Role
  status: '' | AccountStatus
}

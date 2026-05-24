import type { Role } from '@/shared/config/access'

export interface UserInfo {
  id: number
  username: string
  email: string | null
  phone: string | null
  avatar: string | null
  status: number
  role: Role
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateUserParams {
  username: string
  password: string
  email?: string
  phone?: string
  role?: Role
  status?: number
  permissions?: string[]
}

export interface UpdateUserParams {
  username?: string
  email?: string | null
  phone?: string | null
  status?: number
  role?: Role
  permissions?: string[]
}

export interface UserListQuery {
  username: string
  role: '' | Role
  status: '' | '0' | '1'
}

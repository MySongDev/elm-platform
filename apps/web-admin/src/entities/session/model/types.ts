export type { UserInfo } from '@/entities/user'

export interface UserMenuNode {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string | null
  icon: string | null
  permission: string | null
  component: string | null
  type: 'catalog' | 'menu'
  sort: number
  status: number
  children?: UserMenuNode[]
}

export interface UpdateProfileParams {
  username?: string
  email?: string
  phone?: string
}

export interface SecurityLog {
  id: number
  userId: number
  ip: string | null
  address: string | null
  browser: string | null
  os: string | null
  status: number
  message: string | null
  createdAt: string
}

export interface SecurityLogResult {
  list: SecurityLog[]
  total: number
  page: number
  pageSize: number
}

export interface SecurityLogQuery {
  page: number
  pageSize: number
}

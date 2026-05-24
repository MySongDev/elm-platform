export type TreeNode<T> = T & { id: number, parentId: number | null, children?: TreeNode<T>[] }

export interface RoleRecord {
  id: number
  name: string
  code: string
  status: number
  remark: string | null
  permissions: string[]
  createdAt: string
}

export interface MenuRecord {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string | null
  icon: string | null
  permission: string | null
  type: 'catalog' | 'menu' | 'button'
  sort: number
  status: number
}

export interface DeptRecord {
  id: number
  parentId: number | null
  name: string
  leader: string | null
  phone: string | null
  email: string | null
  sort: number
  status: number
}

export interface LoginLogView {
  id: number
  userId: number
  username: string
  ip: string | null
  address: string | null
  browser: string | null
  os: string | null
  status: number
  message: string | null
  createdAt: Date
}

export interface ButtonPermissionRecord {
  code: string
  name: string
  group: string
}

export interface PagePermissionRecord {
  path: string
  name: string
  title: string
  roles: string[]
  auths: string[]
}

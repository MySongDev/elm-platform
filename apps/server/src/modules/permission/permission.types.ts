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

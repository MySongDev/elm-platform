export interface PagePermission {
  path: string
  name?: string
  title: string
  roles: string[]
  auths: string[]
}

export interface ButtonPermission {
  code: string
  name: string
  group: string
}

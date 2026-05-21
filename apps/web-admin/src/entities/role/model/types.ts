export interface RoleItem {
  id: number
  name: string
  code: string
  status: number
  remark: string | null
  permissions: string[]
  createdAt: string
}

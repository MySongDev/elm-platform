export interface DeptItem {
  id: number
  parentId: number | null
  name: string
  leader: string | null
  phone: string | null
  email: string | null
  sort: number
  status: number
  children?: DeptItem[]
}

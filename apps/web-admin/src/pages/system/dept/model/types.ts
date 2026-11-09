import type { AccountStatus } from '@/shared/lib/admin-display'

export interface DeptItem {
  id: number
  parentId: number | null
  name: string
  leader: string | null
  phone: string | null
  email: string | null
  sort: number
  status: AccountStatus
  children?: DeptItem[]
}

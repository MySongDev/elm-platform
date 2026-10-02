import type { AccountStatus } from '@/shared/lib/admin-display'

export interface RoleItem {
  id: number
  name: string
  code: string
  status: AccountStatus
  remark: string | null
  permissions: string[]
  createdAt: string
}

import type { AccountStatus } from '../../common/constants/account-status'

export interface RoleRecord {
  id: number
  name: string
  code: string
  status: AccountStatus
  remark: string | null
  permissions: string[]
  createdAt: string
}

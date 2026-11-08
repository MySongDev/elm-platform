import type { AccountStatus } from '../../common/constants/account-status'

export interface DeptRecord {
  id: number
  parentId: number | null
  name: string
  leader: string | null
  phone: string | null
  email: string | null
  sort: number
  status: AccountStatus
}

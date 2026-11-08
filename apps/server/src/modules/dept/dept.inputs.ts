import type { AccountStatus } from '../../common/constants/account-status'

export interface DeptUpsertInput {
  id?: number
  parentId?: number | null
  name?: string
  leader?: string
  phone?: string
  email?: string
  sort?: number
  status?: AccountStatus
}

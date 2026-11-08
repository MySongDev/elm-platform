import type { AccountStatus } from '../../common/constants/account-status'

export interface MenuUpsertInput {
  id?: number
  parentId?: number | null
  title?: string
  path?: string
  name?: string
  icon?: string
  permission?: string
  component?: string
  type?: 'catalog' | 'menu' | 'button'
  sort?: number
  status?: AccountStatus
}

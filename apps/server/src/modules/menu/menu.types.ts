import type { AccountStatus } from '../../common/constants/account-status'

export interface MenuRecord {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string | null
  icon: string | null
  permission: string | null
  component: string | null
  type: 'catalog' | 'menu' | 'button'
  sort: number
  status: AccountStatus
}

export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'EXPIRED' | 'ARCHIVED'

export type TenantEvent = 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESUME' | 'DISABLE' | 'ACTIVATE' | 'EXPIRE' | 'RENEW' | 'ARCHIVE'

export interface TenantInfo {
  id: number
  code: string
  name: string
  status: TenantStatus
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  planCode: string
  remark: string | null
  createdAt: string
  updatedAt: string
  availableActions: TenantEvent[]
  _count?: {
    users: number
    orders: number
  }
}

export interface TenantActionLog {
  id: number
  tenantId: number
  event: TenantEvent
  fromStatus: TenantStatus
  toStatus: TenantStatus
  actorId: number | string
  actorName: string
  actorType: string
  reason: string | null
  remark: string | null
  createdAt: string
}

export interface CreateTenantParams {
  code: string
  name: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  planCode?: string
  remark?: string
}

export interface UpdateTenantParams {
  name?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  planCode?: string
  remark?: string
}

export interface TenantTransitionParams {
  reason?: string
  remark?: string
}

export interface TenantListQuery {
  name: string
  status: '' | TenantStatus
}

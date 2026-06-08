export const tenantStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'EXPIRED', 'ARCHIVED'] as const
export type TenantStatus = (typeof tenantStatuses)[number]

export const tenantEvents = ['APPROVE', 'REJECT', 'SUSPEND', 'RESUME', 'DISABLE', 'ACTIVATE', 'EXPIRE', 'RENEW', 'ARCHIVE'] as const
export type TenantEvent = (typeof tenantEvents)[number]

export const dataScopes = ['ALL', 'TENANT', 'SHOP', 'SELF'] as const
export type DataScope = (typeof dataScopes)[number]

export const tenantActorTypes = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'SHOP_OPERATOR', 'SYSTEM'] as const
export type TenantActorType = (typeof tenantActorTypes)[number]

export interface TenantStateActor {
  id: number | 'system'
  name: string
  type: TenantActorType
}

export interface TenantContext {
  userId: number
  username: string
  tenantId: number | null
  tenantCode: string | null
  tenantName: string | null
  tenantStatus: TenantStatus | null
  dataScope: DataScope
  boundShopIds: string[]
  isPlatformAdmin: boolean
}

export interface TenantResourceFilter {
  tenantId?: number | { in: number[] }
  shopId?: string | { in: string[] }
  createdBy?: number
}

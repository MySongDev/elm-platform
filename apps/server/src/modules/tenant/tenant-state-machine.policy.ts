import type { TenantActorType, TenantEvent, TenantStatus } from './tenant.types'
import { ConflictException, ForbiddenException } from '@nestjs/common'

const tenantTransitions: Record<TenantStatus, Partial<Record<TenantEvent, TenantStatus>>> = {
  PENDING: {
    APPROVE: 'ACTIVE',
    REJECT: 'ARCHIVED',
  },
  ACTIVE: {
    SUSPEND: 'SUSPENDED',
    DISABLE: 'DISABLED',
    EXPIRE: 'EXPIRED',
  },
  SUSPENDED: {
    RESUME: 'ACTIVE',
    DISABLE: 'DISABLED',
    ARCHIVE: 'ARCHIVED',
  },
  DISABLED: {
    ACTIVATE: 'ACTIVE',
    ARCHIVE: 'ARCHIVED',
  },
  EXPIRED: {
    RENEW: 'ACTIVE',
    ARCHIVE: 'ARCHIVED',
  },
  ARCHIVED: {},
}

const allowedActorMap: Record<TenantEvent, TenantActorType[]> = {
  APPROVE: ['PLATFORM_ADMIN'],
  REJECT: ['PLATFORM_ADMIN'],
  SUSPEND: ['PLATFORM_ADMIN'],
  RESUME: ['PLATFORM_ADMIN'],
  DISABLE: ['PLATFORM_ADMIN'],
  ACTIVATE: ['PLATFORM_ADMIN'],
  EXPIRE: ['PLATFORM_ADMIN', 'SYSTEM'],
  RENEW: ['PLATFORM_ADMIN', 'SYSTEM'],
  ARCHIVE: ['PLATFORM_ADMIN'],
}

export function getNextTenantStatus(status: TenantStatus, event: TenantEvent): TenantStatus {
  const next = tenantTransitions[status]?.[event]

  if (!next)
    throw new ConflictException('当前租户状态不允许执行该动作')

  return next
}

export function getAvailableTenantEvents(status: TenantStatus): TenantEvent[] {
  return Object.keys(tenantTransitions[status] || {}) as TenantEvent[]
}

export function assertTenantActorCanTrigger(event: TenantEvent, actorType: TenantActorType) {
  if (!allowedActorMap[event]?.includes(actorType)) {
    throw new ForbiddenException('无权变更租户生命周期状态')
  }
}

import { ConflictException, ForbiddenException } from '@nestjs/common'
import {
  assertTenantActorCanTrigger,
  getAvailableTenantEvents,
  getNextTenantStatus,
} from './tenant-state-machine.policy'

describe('tenantStateMachinePolicy', () => {
  it('calculates valid tenant transitions', () => {
    expect(getNextTenantStatus('PENDING', 'APPROVE')).toBe('ACTIVE')
    expect(getNextTenantStatus('PENDING', 'REJECT')).toBe('ARCHIVED')
    expect(getNextTenantStatus('ACTIVE', 'SUSPEND')).toBe('SUSPENDED')
    expect(getNextTenantStatus('SUSPENDED', 'RESUME')).toBe('ACTIVE')
    expect(getNextTenantStatus('DISABLED', 'ACTIVATE')).toBe('ACTIVE')
    expect(getNextTenantStatus('EXPIRED', 'RENEW')).toBe('ACTIVE')
  })

  it('rejects invalid transitions and archived recovery', () => {
    expect(() => getNextTenantStatus('PENDING', 'EXPIRE')).toThrow(ConflictException)
    expect(() => getNextTenantStatus('ACTIVE', 'ARCHIVE')).toThrow(ConflictException)
    expect(() => getNextTenantStatus('ARCHIVED', 'ACTIVATE')).toThrow(ConflictException)
  })

  it('returns available events from current status', () => {
    expect(getAvailableTenantEvents('PENDING')).toEqual(['APPROVE', 'REJECT'])
    expect(getAvailableTenantEvents('ACTIVE')).toEqual(['SUSPEND', 'DISABLE', 'EXPIRE'])
    expect(getAvailableTenantEvents('ARCHIVED')).toEqual([])
  })

  it('allows only platform admin or system actors to trigger lifecycle events', () => {
    expect(() => assertTenantActorCanTrigger('APPROVE', 'PLATFORM_ADMIN')).not.toThrow()
    expect(() => assertTenantActorCanTrigger('EXPIRE', 'SYSTEM')).not.toThrow()
    expect(() => assertTenantActorCanTrigger('APPROVE', 'TENANT_ADMIN')).toThrow(ForbiddenException)
    expect(() => assertTenantActorCanTrigger('DISABLE', 'SHOP_OPERATOR')).toThrow(ForbiddenException)
  })
})

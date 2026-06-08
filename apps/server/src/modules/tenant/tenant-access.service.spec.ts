import type { TenantContext } from './tenant.types'
import { ForbiddenException } from '@nestjs/common'
import { TenantAccessService } from './tenant-access.service'

const service = new TenantAccessService()

function context(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    userId: 1,
    username: 'tester',
    tenantId: 10,
    tenantCode: 'tenant-a',
    tenantName: 'Tenant A',
    tenantStatus: 'ACTIVE',
    dataScope: 'TENANT',
    boundShopIds: [],
    isPlatformAdmin: false,
    ...overrides,
  }
}

describe('tenantAccessService', () => {
  it('returns empty resource filter for platform admins', () => {
    expect(service.buildResourceWhere(context({
      dataScope: 'ALL',
      tenantId: null,
      isPlatformAdmin: true,
    }))).toEqual({})
  })

  it('filters tenant scope by tenant id', () => {
    expect(service.buildResourceWhere(context())).toEqual({ tenantId: 10 })
  })

  it('filters shop scope by tenant id and bound shop ids', () => {
    expect(service.buildResourceWhere(context({
      dataScope: 'SHOP',
      boundShopIds: ['1', '2'],
    }))).toEqual({
      tenantId: 10,
      shopId: { in: ['1', '2'] },
    })
  })

  it('rejects shop scope without bound shops', () => {
    expect(() => service.buildResourceWhere(context({
      dataScope: 'SHOP',
      boundShopIds: [],
    }))).toThrow(ForbiddenException)
  })

  it('rejects write operations for readonly tenant statuses', () => {
    expect(() => service.assertCanWrite(context({ tenantStatus: 'ACTIVE' }))).not.toThrow()
    expect(() => service.assertCanWrite(context({ tenantStatus: 'SUSPENDED' }))).toThrow(ForbiddenException)
    expect(() => service.assertCanWrite(context({ tenantStatus: 'EXPIRED' }))).toThrow(ForbiddenException)
  })

  it('rejects read operations for inactive terminal statuses', () => {
    expect(() => service.assertCanRead(context({ tenantStatus: 'ACTIVE' }))).not.toThrow()
    expect(() => service.assertCanRead(context({ tenantStatus: 'DISABLED' }))).toThrow(ForbiddenException)
    expect(() => service.assertCanRead(context({ tenantStatus: 'ARCHIVED' }))).toThrow(ForbiddenException)
  })

  it('allows platform admins to narrow requested scope', () => {
    expect(service.buildScopedWhere(context({
      dataScope: 'ALL',
      tenantId: null,
      isPlatformAdmin: true,
    }), { tenantId: 20 })).toEqual({ tenantId: 20 })
    expect(service.buildScopedWhere(context({
      dataScope: 'ALL',
      tenantId: null,
      isPlatformAdmin: true,
    }), { shopId: '2' })).toEqual({ shopId: '2' })
  })

  it('rejects tenant users requesting another tenant id', () => {
    expect(() => service.buildScopedWhere(context(), { tenantId: 20 })).toThrow(ForbiddenException)
  })

  it('rejects shop users requesting unbound shop id', () => {
    expect(() => service.buildScopedWhere(context({
      dataScope: 'SHOP',
      boundShopIds: ['1', '2'],
    }), { shopId: '3' })).toThrow(ForbiddenException)
  })

  it('defaults shop users to all bound shops when shop id is omitted', () => {
    expect(service.buildScopedWhere(context({
      dataScope: 'SHOP',
      boundShopIds: ['1', '2'],
    }))).toEqual({
      tenantId: 10,
      shopId: { in: ['1', '2'] },
    })
  })
})

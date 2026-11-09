import type { TenantEvent, TenantInfo } from '@/entities/tenant'
import { describe, expect, it } from 'vitest'
import { Permissions } from '@/shared/config/access'
import { getVisibleTenantActions, tenantActionConfig } from './workflow'

const tenantEvents: TenantEvent[] = [
  'APPROVE',
  'REJECT',
  'SUSPEND',
  'RESUME',
  'DISABLE',
  'ACTIVATE',
  'EXPIRE',
  'RENEW',
  'ARCHIVE',
]

function createTenant(overrides: Partial<TenantInfo> = {}): TenantInfo {
  return {
    id: 1,
    code: 'demo-tenant',
    name: '示例租户',
    status: 'PENDING',
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    planCode: 'standard',
    remark: null,
    createdAt: '2026-06-08T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z',
    availableActions: ['APPROVE', 'REJECT'],
    ...overrides,
  }
}

describe('tenant workflow config', () => {
  it('aligns every tenant state action with the platform tenant transition permission', () => {
    expect(Object.keys(tenantActionConfig).sort()).toEqual([...tenantEvents].sort())

    for (const event of tenantEvents) {
      expect(tenantActionConfig[event].permission).toBe(Permissions.PLATFORM_TENANT_TRANSITION)
    }
  })

  it('shows backend-provided tenant actions only when the current user can transition tenants', () => {
    const tenant = createTenant({
      availableActions: ['APPROVE', 'REJECT'],
    })

    const visible = getVisibleTenantActions(
      tenant,
      permission => permission === Permissions.PLATFORM_TENANT_TRANSITION,
    )
    const hidden = getVisibleTenantActions(tenant, () => false)

    expect(visible.map(item => item.action)).toEqual(['APPROVE', 'REJECT'])
    expect(hidden).toEqual([])
  })

  it('does not show tenant actions when the backend returns none', () => {
    const tenant = createTenant({
      availableActions: [],
    })

    expect(getVisibleTenantActions(tenant, () => true)).toEqual([])
  })
})

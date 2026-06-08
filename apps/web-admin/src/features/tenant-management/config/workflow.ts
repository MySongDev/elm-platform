import type { TenantEvent, TenantInfo } from '@/entities/tenant'
import type { ActionConfig } from '@/shared/workflow/model/types'
import { Permissions } from '@/shared/config/access'
import { getVisibleActions } from '@/shared/workflow/model/permissions'

export const tenantActionConfig: Record<TenantEvent, ActionConfig> = {
  APPROVE: {
    label: '审核通过',
    type: 'success',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
  REJECT: {
    label: '拒绝',
    type: 'danger',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
    danger: true,
  },
  SUSPEND: {
    label: '暂停',
    type: 'warning',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
  RESUME: {
    label: '恢复',
    type: 'success',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
  DISABLE: {
    label: '禁用',
    type: 'danger',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
    danger: true,
  },
  ACTIVATE: {
    label: '激活',
    type: 'success',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
  EXPIRE: {
    label: '过期',
    type: 'warning',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
  RENEW: {
    label: '续期',
    type: 'success',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
  ARCHIVE: {
    label: '归档',
    type: 'info',
    permission: Permissions.PLATFORM_TENANT_TRANSITION,
  },
}

export function getVisibleTenantActions(
  tenant: TenantInfo,
  hasPermission: (permission: string) => boolean,
) {
  return getVisibleActions(tenantActionConfig, {
    availableActions: tenant.availableActions || [],
    hasPermission,
    record: tenant,
  })
}

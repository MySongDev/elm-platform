import type { TenantAccessService } from '../tenant/tenant-access.service'
import type { TenantContext } from '../tenant/tenant.types'
import { ForbiddenException } from '@nestjs/common'

type PaymentOrderRecord = Record<string, any>

/** 详情读取和状态变更使用同一租户/门店可见性判定；越权记录仍由调用方按 404 隐藏。 */
export function isOrderAllowed(order: PaymentOrderRecord, context: TenantContext | undefined, tenantAccess: TenantAccessService) {
  if (!context || context.dataScope === 'ALL')
    return true

  tenantAccess.assertCanRead(context)

  if (!context.tenantId)
    throw new ForbiddenException('当前账号未绑定租户')

  if (Number(order.tenantId) !== context.tenantId)
    return false

  if (context.dataScope === 'SHOP')
    return Boolean(order.shopId && context.boundShopIds.includes(String(order.shopId)))

  return true
}

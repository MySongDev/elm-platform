import type { TenantContext, TenantResourceFilter } from './tenant.types'
import { ForbiddenException, Injectable } from '@nestjs/common'

@Injectable()
export class TenantAccessService {
  buildResourceWhere(context: TenantContext): TenantResourceFilter {
    if (context.dataScope === 'ALL')
      return {}

    if (!context.tenantId)
      throw new ForbiddenException('当前账号未绑定租户')

    if (context.dataScope === 'TENANT')
      return { tenantId: context.tenantId }

    if (context.dataScope === 'SHOP') {
      if (!context.boundShopIds.length)
        throw new ForbiddenException('当前账号未绑定店铺')

      return {
        tenantId: context.tenantId,
        shopId: { in: context.boundShopIds },
      }
    }

    return {
      tenantId: context.tenantId,
      createdBy: context.userId,
    }
  }

  buildScopedWhere(
    context: TenantContext,
    query: {
      tenantId?: number | string | null
      shopId?: string | number | null
    } = {},
  ): TenantResourceFilter {
    this.assertRequestedScopeAllowed(context, query)

    const base = this.buildResourceWhere(context)

    if (context.dataScope === 'ALL') {
      return {
        ...(query.tenantId ? { tenantId: Number(query.tenantId) } : {}),
        ...(query.shopId ? { shopId: String(query.shopId) } : {}),
      }
    }

    if (query.shopId) {
      return {
        ...base,
        shopId: String(query.shopId),
      }
    }

    return base
  }

  assertRequestedScopeAllowed(
    context: TenantContext,
    query: {
      tenantId?: number | string | null
      shopId?: string | number | null
    } = {},
  ) {
    if (context.dataScope === 'ALL')
      return

    if (query.tenantId && Number(query.tenantId) !== context.tenantId) {
      throw new ForbiddenException('无权筛选其它租户数据')
    }

    if (context.dataScope === 'SHOP' && query.shopId && !context.boundShopIds.includes(String(query.shopId))) {
      throw new ForbiddenException('无权筛选未绑定店铺数据')
    }
  }

  assertCanRead(context: TenantContext) {
    if (context.isPlatformAdmin)
      return

    if (!context.tenantStatus)
      throw new ForbiddenException('当前账号未绑定租户')

    if (['PENDING', 'DISABLED', 'ARCHIVED'].includes(context.tenantStatus)) {
      throw new ForbiddenException('当前租户状态不允许访问业务数据')
    }
  }

  assertCanWrite(context: TenantContext) {
    if (context.isPlatformAdmin)
      return

    if (!context.tenantStatus)
      throw new ForbiddenException('当前账号未绑定租户')

    if (context.tenantStatus !== 'ACTIVE') {
      throw new ForbiddenException('当前租户状态不允许执行该操作')
    }
  }

  assertShopAllowed(context: TenantContext, shopId?: string | null) {
    if (context.dataScope !== 'SHOP')
      return

    if (!shopId || !context.boundShopIds.includes(String(shopId))) {
      throw new ForbiddenException('无权访问该店铺数据')
    }
  }
}

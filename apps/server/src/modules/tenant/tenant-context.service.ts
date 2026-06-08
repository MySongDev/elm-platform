import type { DataScope, TenantContext, TenantStatus } from './tenant.types'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) {}

  async fromRequestUser(user: {
    id?: number
    username?: string
  }): Promise<TenantContext> {
    if (!user?.id)
      throw new ForbiddenException('后台登录状态无效')

    const record = await this.prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: {
        id: true,
        username: true,
        dataScope: true,
        boundShopIds: true,
        tenant: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!record)
      throw new ForbiddenException('后台用户不存在')

    const dataScope = (record.dataScope || 'ALL') as DataScope

    return {
      userId: record.id,
      username: record.username,
      tenantId: record.tenant?.id ?? null,
      tenantCode: record.tenant?.code ?? null,
      tenantName: record.tenant?.name ?? null,
      tenantStatus: (record.tenant?.status ?? null) as TenantStatus | null,
      dataScope,
      boundShopIds: record.boundShopIds ?? [],
      isPlatformAdmin: dataScope === 'ALL',
    }
  }
}

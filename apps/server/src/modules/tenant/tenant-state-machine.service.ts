import type { TenantEvent, TenantStateActor, TenantStatus } from './tenant.types'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import {
  assertTenantActorCanTrigger,
  getAvailableTenantEvents,
  getNextTenantStatus,
} from './tenant-state-machine.policy'

interface TransitionTenantPayload {
  tenantId: number
  event: TenantEvent
  actor: TenantStateActor
  reason?: string
  remark?: string
  requestId?: string
}

@Injectable()
export class TenantStateMachineService {
  constructor(private readonly prisma: PrismaService) {}

  async transitionTenant(payload: TransitionTenantPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: payload.tenantId },
    })

    if (!tenant)
      throw new NotFoundException('租户不存在')

    const currentStatus = tenant.status as TenantStatus
    assertTenantActorCanTrigger(payload.event, payload.actor.type)
    const nextStatus = getNextTenantStatus(currentStatus, payload.event)

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.tenant.updateMany({
        where: {
          id: payload.tenantId,
          status: currentStatus,
        },
        data: {
          status: nextStatus,
        },
      })

      if (updated.count !== 1)
        throw new ConflictException('租户状态已变更，请刷新后重试')

      await tx.tenantActionLog.create({
        data: {
          tenantId: payload.tenantId,
          event: payload.event,
          fromStatus: currentStatus,
          toStatus: nextStatus,
          actorId: String(payload.actor.id),
          actorName: payload.actor.name,
          actorType: payload.actor.type,
          reason: payload.reason,
          remark: payload.remark,
          requestId: payload.requestId,
        },
      })

      await tx.operationLog.create({
        data: {
          username: payload.actor.name,
          module: '租户管理',
          action: `租户状态变更:${payload.event}`,
          method: 'POST',
          path: `/admin/tenants/${payload.tenantId}/events/${payload.event}`,
          status: 200,
          duration: 0,
          tenantId: payload.tenantId,
          tenantCode: tenant.code,
        },
      })
    })

    const nextTenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: payload.tenantId },
    })

    return {
      ...nextTenant,
      availableActions: getAvailableTenantEvents(nextTenant.status as TenantStatus),
    }
  }
}

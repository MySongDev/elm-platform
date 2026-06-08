import type { CreateTenantDto, TenantTransitionDto, UpdateTenantDto } from './dto/tenant.dto'
import type { TenantEvent, TenantStateActor, TenantStatus } from './tenant.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { getAvailableTenantEvents } from './tenant-state-machine.policy'
import { TenantStateMachineService } from './tenant-state-machine.service'

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: TenantStateMachineService,
  ) {}

  async listTenants() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return tenants.map((tenant: { status: string }) => this.withAvailableActions(tenant))
  }

  async createTenant(dto: CreateTenantDto) {
    const tenant = await this.prisma.tenant.create({
      data: {
        code: dto.code,
        name: dto.name,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        planCode: dto.planCode ?? 'standard',
        remark: dto.remark,
      },
    })
    return this.withAvailableActions(tenant)
  }

  async updateTenant(id: number, dto: UpdateTenantDto) {
    await this.ensureTenantExists(id)
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        planCode: dto.planCode,
        remark: dto.remark,
      },
    })
    return this.withAvailableActions(tenant)
  }

  async getTenantDetail(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
          },
        },
      },
    })

    if (!tenant)
      throw new NotFoundException('租户不存在')

    return this.withAvailableActions(tenant)
  }

  async getTenantActionLogs(id: number) {
    await this.ensureTenantExists(id)
    return this.prisma.tenantActionLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
    })
  }

  transitionTenant(
    id: number,
    event: TenantEvent,
    actor: TenantStateActor,
    dto: TenantTransitionDto,
  ) {
    return this.stateMachine.transitionTenant({
      tenantId: id,
      event,
      actor,
      reason: dto.reason,
      remark: dto.remark,
    })
  }

  private async ensureTenantExists(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!tenant)
      throw new NotFoundException('租户不存在')
  }

  private withAvailableActions<T extends { status: string }>(tenant: T) {
    return {
      ...tenant,
      availableActions: getAvailableTenantEvents(tenant.status as TenantStatus),
    }
  }
}

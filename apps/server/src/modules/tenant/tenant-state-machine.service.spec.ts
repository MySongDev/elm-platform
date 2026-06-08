import { ConflictException, ForbiddenException } from '@nestjs/common'
import { TenantStateMachineService } from './tenant-state-machine.service'

function createPrismaMock(overrides: Record<string, any> = {}) {
  const tx = {
    tenant: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    tenantActionLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    operationLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
  }

  return {
    tx,
    prisma: {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          code: 'flower-cake',
          name: '鲜花蛋糕租户',
          status: 'PENDING',
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 1,
          code: 'flower-cake',
          name: '鲜花蛋糕租户',
          status: 'ACTIVE',
        }),
      },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      ...overrides,
    },
  }
}

describe('tenantStateMachineService', () => {
  it('updates tenant status and returns available actions', async () => {
    const { prisma } = createPrismaMock()
    const service = new TenantStateMachineService(prisma as any)

    await expect(service.transitionTenant({
      tenantId: 1,
      event: 'APPROVE',
      actor: {
        id: 1,
        name: 'admin',
        type: 'PLATFORM_ADMIN',
      },
    })).resolves.toMatchObject({
      id: 1,
      status: 'ACTIVE',
      availableActions: ['SUSPEND', 'DISABLE', 'EXPIRE'],
    })
  })

  it('creates tenant action log and operation log for valid transitions', async () => {
    const { prisma, tx } = createPrismaMock()
    const service = new TenantStateMachineService(prisma as any)

    await service.transitionTenant({
      tenantId: 1,
      event: 'APPROVE',
      actor: {
        id: 1,
        name: 'admin',
        type: 'PLATFORM_ADMIN',
      },
      reason: '审核通过',
      requestId: 'req-1',
    })

    expect(tx.tenantActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 1,
        event: 'APPROVE',
        fromStatus: 'PENDING',
        toStatus: 'ACTIVE',
        actorName: 'admin',
        requestId: 'req-1',
      }),
    })
    expect(tx.operationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 1,
        tenantCode: 'flower-cake',
        module: '租户管理',
      }),
    })
  })

  it('does not write logs for invalid transitions', async () => {
    const { prisma, tx } = createPrismaMock({
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          code: 'flower-cake',
          status: 'ACTIVE',
        }),
      },
    })
    const service = new TenantStateMachineService(prisma as any)

    await expect(service.transitionTenant({
      tenantId: 1,
      event: 'ARCHIVE',
      actor: {
        id: 1,
        name: 'admin',
        type: 'PLATFORM_ADMIN',
      },
    })).rejects.toThrow(ConflictException)

    expect(tx.tenantActionLog.create).not.toHaveBeenCalled()
    expect(tx.operationLog.create).not.toHaveBeenCalled()
  })

  it('does not write logs for unauthorized actors', async () => {
    const { prisma, tx } = createPrismaMock()
    const service = new TenantStateMachineService(prisma as any)

    await expect(service.transitionTenant({
      tenantId: 1,
      event: 'APPROVE',
      actor: {
        id: 2,
        name: 'tenant',
        type: 'TENANT_ADMIN',
      },
    })).rejects.toThrow(ForbiddenException)

    expect(tx.tenantActionLog.create).not.toHaveBeenCalled()
    expect(tx.operationLog.create).not.toHaveBeenCalled()
  })

  it('throws conflict when concurrent status update wins first', async () => {
    const { prisma, tx } = createPrismaMock()
    tx.tenant.updateMany.mockResolvedValue({ count: 0 })
    const service = new TenantStateMachineService(prisma as any)

    await expect(service.transitionTenant({
      tenantId: 1,
      event: 'APPROVE',
      actor: {
        id: 1,
        name: 'admin',
        type: 'PLATFORM_ADMIN',
      },
    })).rejects.toThrow(ConflictException)

    expect(tx.tenantActionLog.create).not.toHaveBeenCalled()
    expect(tx.operationLog.create).not.toHaveBeenCalled()
  })
})

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { MerchantOnboardingService } from './merchant-onboarding.service'

const createdAt = new Date('2026-06-01T08:00:00.000Z')
const updatedAt = new Date('2026-06-01T09:00:00.000Z')

function createApplication(overrides: Record<string, any> = {}) {
  return {
    id: 'app_1',
    merchantName: 'Flower Cake',
    contactName: 'Alice',
    contactPhone: '13800138000',
    businessCategory: 'Dessert',
    address: 'Shanghai',
    status: 'PENDING',
    materials: [
      {
        id: 'mat_1',
        name: 'license.png',
        type: 'image',
        url: 'https://example.test/license.png',
      },
    ],
    createdAt,
    updatedAt,
    ...overrides,
  }
}

function createPrismaMock(overrides: Record<string, any> = {}) {
  const before = createApplication()
  const after = createApplication({ status: 'UNDER_REVIEW' })
  const tx = {
    merchantApplication: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    merchantApplicationActionLog: {
      create: jest.fn().mockResolvedValue({ id: 'log_1' }),
    },
    operationLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
  }

  return {
    tx,
    prisma: {
      merchantApplication: {
        findMany: jest.fn().mockResolvedValue([before]),
        findUnique: jest.fn().mockResolvedValue(before),
        findUniqueOrThrow: jest.fn().mockResolvedValue(after),
      },
      merchantApplicationActionLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log_1',
            event: 'START_REVIEW',
            fromStatus: 'PENDING',
            toStatus: 'UNDER_REVIEW',
            actorName: 'admin',
            reason: null,
            remark: null,
            createdAt,
          },
        ]),
      },
      $transaction: jest.fn(async (callback: any) => callback(tx)),
      ...overrides,
    },
  }
}

describe('merchantOnboardingService', () => {
  it('lists applications with filters and frontend action hints', async () => {
    const { prisma } = createPrismaMock()
    const service = new MerchantOnboardingService(prisma as any)

    const result = await service.listApplications({
      status: 'PENDING',
      merchantName: 'Flower',
    })

    expect(prisma.merchantApplication.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'PENDING',
        merchantName: {
          contains: 'Flower',
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    }))
    expect(result).toEqual([
      expect.objectContaining({
        id: 'app_1',
        merchantName: 'Flower Cake',
        availableActions: ['VIEW', 'START_REVIEW'],
        materials: [expect.objectContaining({ id: 'mat_1' })],
      }),
    ])
  })

  it('throws not found when detail does not exist', async () => {
    const { prisma } = createPrismaMock({
      merchantApplication: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn(),
      },
    })
    const service = new MerchantOnboardingService(prisma as any)

    await expect(service.getApplicationDetail('missing')).rejects.toThrow(NotFoundException)
  })

  it('transitions applications and writes action plus operation logs', async () => {
    const { prisma, tx } = createPrismaMock()
    const service = new MerchantOnboardingService(prisma as any)

    const result = await service.reviewApplication('app_1', {
      action: 'START_REVIEW',
      remark: 'Taking ownership',
    }, {
      id: 1,
      name: 'admin',
      type: 'PLATFORM_ADMIN',
    })

    expect(result).toEqual(expect.objectContaining({
      id: 'app_1',
      status: 'UNDER_REVIEW',
      availableActions: ['VIEW', 'APPROVE', 'REJECT', 'REQUEST_SUPPLEMENT'],
    }))
    expect(tx.merchantApplication.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'app_1',
        status: 'PENDING',
      },
      data: expect.objectContaining({
        status: 'UNDER_REVIEW',
      }),
    })
    expect(tx.merchantApplicationActionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: 'app_1',
        event: 'START_REVIEW',
        fromStatus: 'PENDING',
        toStatus: 'UNDER_REVIEW',
        actorId: '1',
        actorName: 'admin',
        actorType: 'PLATFORM_ADMIN',
        remark: 'Taking ownership',
      }),
    })
    expect(tx.operationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: 'admin',
        module: 'Merchant Onboarding',
        path: '/admin/merchant-applications/app_1/review',
        status: 200,
      }),
    })
  })

  it('requires reasons for reject and supplement requests', async () => {
    const { prisma } = createPrismaMock({
      merchantApplication: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(createApplication({ status: 'UNDER_REVIEW' })),
        findUniqueOrThrow: jest.fn(),
      },
    })
    const service = new MerchantOnboardingService(prisma as any)

    await expect(service.reviewApplication('app_1', {
      action: 'REJECT',
    }, {
      id: 1,
      name: 'admin',
      type: 'PLATFORM_ADMIN',
    })).rejects.toThrow(BadRequestException)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('does not write logs for invalid transitions', async () => {
    const { prisma, tx } = createPrismaMock({
      merchantApplication: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(createApplication({ status: 'APPROVED' })),
        findUniqueOrThrow: jest.fn(),
      },
    })
    const service = new MerchantOnboardingService(prisma as any)

    await expect(service.reviewApplication('app_1', {
      action: 'REJECT',
      reason: 'Not eligible',
    }, {
      id: 1,
      name: 'admin',
      type: 'PLATFORM_ADMIN',
    })).rejects.toThrow(ConflictException)

    expect(tx.merchantApplicationActionLog.create).not.toHaveBeenCalled()
    expect(tx.operationLog.create).not.toHaveBeenCalled()
  })

  it('returns application action logs after checking the application exists', async () => {
    const { prisma } = createPrismaMock()
    const service = new MerchantOnboardingService(prisma as any)

    const logs = await service.getApplicationActionLogs('app_1')

    expect(prisma.merchantApplication.findUnique).toHaveBeenCalledWith({
      where: { id: 'app_1' },
      select: { id: true },
    })
    expect(prisma.merchantApplicationActionLog.findMany).toHaveBeenCalledWith({
      where: { applicationId: 'app_1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(logs).toEqual([
      expect.objectContaining({
        id: 'log_1',
        event: 'START_REVIEW',
        fromStatus: 'PENDING',
        toStatus: 'UNDER_REVIEW',
      }),
    ])
  })
})

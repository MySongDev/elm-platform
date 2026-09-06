import type { TenantContext } from '../tenant/tenant.types'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { UserService } from './user.service'

function createContext(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    userId: 1,
    username: 'admin',
    tenantId: null,
    tenantCode: null,
    tenantName: null,
    tenantStatus: null,
    dataScope: 'ALL',
    boundShopIds: [],
    isPlatformAdmin: true,
    ...overrides,
  }
}

function createService() {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 2,
        username: 'tenant_admin',
        email: null,
        phone: null,
        avatar: null,
        status: 1,
        role: 'tenant_admin',
        permissions: [],
        tenantId: 10,
        dataScope: 'TENANT',
        boundShopIds: [],
        createdAt: new Date('2026-06-02T00:00:00.000Z'),
        updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      }),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  }
  const redis = {
    del: jest.fn().mockResolvedValue(undefined),
    getObject: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  }

  return {
    service: new UserService(prisma as any, redis as any),
    prisma,
    redis,
  }
}

describe('userService tenant fields', () => {
  it('rejects ALL users with tenant id', async () => {
    const { service } = createService()

    await expect(service.create({
      username: 'platform',
      password: 'password123',
      role: 'admin',
      tenantId: 10,
      dataScope: 'ALL',
    }, createContext())).rejects.toThrow(BadRequestException)
  })

  it('rejects tenant users without tenant id', async () => {
    const { service } = createService()

    await expect(service.create({
      username: 'tenant',
      password: 'password123',
      role: 'tenant_admin',
      dataScope: 'TENANT',
    }, createContext())).rejects.toThrow(BadRequestException)
  })

  it('rejects shop users without bound shops', async () => {
    const { service } = createService()

    await expect(service.create({
      username: 'shop',
      password: 'password123',
      role: 'shop_operator',
      tenantId: 10,
      dataScope: 'SHOP',
      boundShopIds: [],
    }, createContext())).rejects.toThrow(BadRequestException)
  })

  it('allows platform admin to create a valid tenant admin', async () => {
    const { service, prisma } = createService()

    await service.create({
      username: 'tenant_admin',
      password: 'password123',
      role: 'tenant_admin',
      tenantId: 10,
      dataScope: 'TENANT',
      boundShopIds: [],
    }, createContext())

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tenantId: 10,
        dataScope: 'TENANT',
      }),
    }))
  })

  it('rejects tenant admin creating platform admins', async () => {
    const { service } = createService()

    await expect(service.create({
      username: 'platform',
      password: 'password123',
      role: 'admin',
      dataScope: 'ALL',
    }, createContext({
      tenantId: 10,
      dataScope: 'TENANT',
      isPlatformAdmin: false,
    }))).rejects.toThrow(ForbiddenException)
  })

  it('rejects tenant admin creating users in another tenant', async () => {
    const { service } = createService()

    await expect(service.create({
      username: 'other',
      password: 'password123',
      role: 'tenant_admin',
      tenantId: 20,
      dataScope: 'TENANT',
    }, createContext({
      tenantId: 10,
      dataScope: 'TENANT',
      isPlatformAdmin: false,
    }))).rejects.toThrow(ForbiddenException)
  })

  it('allows tenant admin creating shop users inside own tenant', async () => {
    const { service, prisma } = createService()

    await service.create({
      username: 'shop',
      password: 'password123',
      role: 'shop_operator',
      tenantId: 10,
      dataScope: 'SHOP',
      boundShopIds: ['1'],
    }, createContext({
      tenantId: 10,
      dataScope: 'TENANT',
      isPlatformAdmin: false,
    }))

    expect(prisma.user.create).toHaveBeenCalled()
  })
})

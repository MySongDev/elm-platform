import type { TenantContext } from '../tenant/tenant.types'
import { AdminService } from './admin.service'

describe('adminService monitor APIs', () => {
  function createService(overrides: {
    prisma?: Record<string, any>
    redis?: Record<string, any>
  } = {}) {
    const prisma = {
      loginLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      operationLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      systemLog: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $queryRawUnsafe: jest.fn().mockResolvedValue(1),
      ...overrides.prisma,
    }
    const redis = {
      getClient: jest.fn().mockReturnValue({
        keys: jest.fn().mockResolvedValue([]),
        ping: jest.fn().mockResolvedValue('PONG'),
      }),
      getObject: jest.fn(),
      del: jest.fn().mockResolvedValue(undefined),
      ...overrides.redis,
    }
    const tenantAccess = {
      assertCanRead: jest.fn(),
    }

    return {
      service: new AdminService(prisma as any, redis as any, tenantAccess as any),
      prisma,
      redis,
      tenantAccess,
    }
  }

  function tenantContext(overrides: Partial<TenantContext> = {}): TenantContext {
    return {
      userId: 1,
      username: 'tenant-admin',
      tenantId: 10,
      tenantCode: 'flower-cake',
      tenantName: '鲜花蛋糕',
      tenantStatus: 'ACTIVE',
      dataScope: 'TENANT',
      boundShopIds: [],
      isPlatformAdmin: false,
      ...overrides,
    }
  }

  it('returns an empty online-user list when Redis online state is unavailable', async () => {
    const loginLogFindMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        user: { username: 'admin' },
        ip: '127.0.0.1',
        address: null,
        browser: 'Chrome',
        os: 'Windows',
        status: 1,
        message: '登录成功',
        createdAt: new Date('2026-05-23T00:00:00.000Z'),
      },
    ])
    const { service } = createService({
      prisma: {
        loginLog: {
          findMany: loginLogFindMany,
        },
      },
      redis: {
        getClient: jest.fn().mockReturnValue({
          keys: jest.fn().mockRejectedValue(new Error('redis offline')),
          ping: jest.fn().mockResolvedValue('PONG'),
        }),
      },
    })

    await expect(service.getOnlineUsers()).resolves.toEqual([])
    expect(loginLogFindMany).not.toHaveBeenCalled()
  })

  it('does not synthesize operation logs from login logs when operation_logs is unavailable', async () => {
    const loginLogFindMany = jest.fn().mockResolvedValue([
      {
        id: 1,
        userId: 1,
        user: { username: 'admin' },
        ip: '127.0.0.1',
        address: null,
        browser: 'Chrome',
        os: 'Windows',
        status: 1,
        message: '登录成功',
        createdAt: new Date('2026-05-23T00:00:00.000Z'),
      },
    ])
    const { service } = createService({
      prisma: {
        loginLog: {
          findMany: loginLogFindMany,
        },
        operationLog: {
          findMany: jest.fn().mockRejectedValue(new Error('missing operation_logs')),
        },
      },
    })

    await expect(service.getOperationLogs()).resolves.toEqual([])
    expect(loginLogFindMany).not.toHaveBeenCalled()
  })

  it('filters login logs by tenant user when context is provided', async () => {
    const { service, prisma } = createService()

    await service.getLoginLogs(tenantContext())

    expect(prisma.loginLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { user: { tenantId: 10 } },
    }))
  })

  it('does not filter login logs for platform admins', async () => {
    const { service, prisma } = createService()

    await service.getLoginLogs(tenantContext({
      dataScope: 'ALL',
      tenantId: null,
      isPlatformAdmin: true,
    }))

    expect(prisma.loginLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: undefined,
    }))
  })

  it('filters operation logs by tenantId when context is provided', async () => {
    const { service, prisma } = createService()

    await service.getOperationLogs(tenantContext())

    expect(prisma.operationLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 10 },
    }))
  })

  it('returns runtime system logs for non-platform admins', async () => {
    const { service, prisma, tenantAccess } = createService()

    const result = await service.getSystemLogs(tenantContext())

    expect(tenantAccess.assertCanRead).toHaveBeenCalled()
    expect(prisma.systemLog.findMany).not.toHaveBeenCalled()
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'NestJS' }),
    ]))
  })

  it('reads full system logs for platform admins', async () => {
    const systemLogs = [{
      id: 1,
      level: 'info',
      source: 'test',
      message: 'ok',
    }]
    const { service, prisma } = createService({
      prisma: {
        systemLog: {
          findMany: jest.fn().mockResolvedValue(systemLogs),
        },
      },
    })

    const result = await service.getSystemLogs(tenantContext({
      dataScope: 'ALL',
      tenantId: null,
      isPlatformAdmin: true,
    }))

    expect(prisma.systemLog.findMany).toHaveBeenCalled()
    expect(result).toEqual(systemLogs)
  })
})

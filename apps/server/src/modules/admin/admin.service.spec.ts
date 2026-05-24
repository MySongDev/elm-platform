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

    return {
      service: new AdminService(prisma as any, redis as any),
      prisma,
      redis,
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
})

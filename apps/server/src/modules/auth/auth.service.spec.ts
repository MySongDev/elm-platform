import type { JwtService } from '@nestjs/jwt'
import type { PrismaService } from '../../prisma/prisma.service'
import type { RedisService } from '../../redis/redis.service'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { AuthService } from './auth.service'

describe('authService admin login', () => {
  const passwordHash = bcrypt.hashSync('admin123', 10)
  const admin = {
    id: 1,
    username: 'admin',
    password: passwordHash,
    email: 'admin@example.com',
    phone: '13800138000',
    avatar: null,
    status: 1,
    role: 'admin',
    permissions: ['*:*:*'],
    tenant: null,
    dataScope: 'ALL',
    boundShopIds: [],
  }

  function createService(user = admin) {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      loginLog: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    } as any

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as any

    const redis = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    } as any

    return {
      service: new AuthService(prisma, jwtService, redis),
      prisma,
      jwtService,
      redis,
    }
  }

  it('logs in with username and signs an admin token', async () => {
    const { service, prisma, jwtService } = createService()

    const result = await service.login('admin', 'admin123', '127.0.0.1', 'Chrome')

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ username: 'admin' }, { phone: 'admin' }] },
      include: {
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
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    }, { expiresIn: '24h' })
    expect(result.token).toBe('signed-token')
    expect(result.expiresIn).toBe(24 * 60 * 60)
    expect(result.user.phone).toBe('13800138000')
    expect(result.user.tenant).toBeNull()
    expect(result.user.dataScope).toBe('ALL')
    expect(result.user.boundShopIds).toEqual([])
  })

  it('signs a 7-day token when remember me is enabled', async () => {
    const { service, jwtService, redis } = createService()

    const result = await service.login('admin', 'admin123', '127.0.0.1', 'Chrome', true)

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    }, { expiresIn: '7d' })
    expect(result.expiresIn).toBe(7 * 24 * 60 * 60)
    expect(redis.set).toHaveBeenCalledWith(
      'admin:online:1',
      expect.objectContaining({ username: 'admin' }),
      7 * 24 * 60 * 60,
    )
  })

  it('logs in with phone', async () => {
    const { service, prisma } = createService()

    await service.login('13800138000', 'admin123')

    expect(prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ username: '13800138000' }, { phone: '13800138000' }] },
    }))
  })

  it('rejects wrong passwords without leaking account existence', async () => {
    const { service } = createService()

    await expect(service.login('admin', 'wrong-password')).rejects.toThrow(UnauthorizedException)
  })
})

describe('authService menu permissions', () => {
  function createMenuService() {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          role: 'user',
          permissions: [],
        }),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue({
          permissions: ['permission:page:view'],
          status: 1,
        }),
      },
      menu: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            parentId: null,
            title: '权限管理',
            path: '/permission',
            name: 'Permission',
            icon: 'permission',
            permission: null,
            type: 'catalog',
            sort: 1,
            status: 1,
          },
          {
            id: 2,
            parentId: 1,
            title: '页面权限',
            path: '/permission/page',
            name: 'PagePermission',
            icon: 'permission',
            permission: 'permission:page:view',
            type: 'menu',
            sort: 1,
            status: 1,
          },
          {
            id: 3,
            parentId: 1,
            title: '按钮权限',
            path: '/permission/button',
            name: 'ButtonPermission',
            icon: 'permission',
            permission: 'permission:button:view',
            type: 'menu',
            sort: 2,
            status: 1,
          },
        ]),
      },
    } as unknown as PrismaService

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService

    const redis = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService

    return {
      service: new AuthService(prisma, jwtService, redis),
      prisma,
    }
  }

  it('uses enabled role permissions when building user menus', async () => {
    const { service, prisma } = createMenuService()

    const menus = await service.getUserMenus(7)

    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { code: 'user' },
      select: {
        permissions: true,
        status: true,
      },
    })
    expect(menus).toHaveLength(1)
    expect(menus[0].children?.map(menu => menu.permission)).toEqual(['permission:page:view'])
  })
})

describe('authService account center', () => {
  function createAccountService() {
    const updatedUser = {
      id: 1,
      username: 'admin-new',
      email: null,
      phone: null,
      avatar: null,
      status: 1,
      role: 'admin',
      permissions: ['admin:profile:update'],
      createdAt: new Date('2026-05-27T00:00:00.000Z'),
      updatedAt: new Date('2026-05-27T00:00:00.000Z'),
    }
    const prisma = {
      user: {
        update: jest.fn().mockResolvedValue(updatedUser),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue({
          permissions: ['admin:dashboard:view'],
          status: 1,
        }),
      },
      loginLog: {
        count: jest.fn().mockResolvedValue(12),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            ip: '127.0.0.1',
            address: null,
            browser: 'Chrome',
            os: 'Windows',
            status: 1,
            message: '登录成功',
            createdAt: new Date('2026-05-27T00:00:00.000Z'),
          },
        ]),
      },
    } as unknown as PrismaService

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService

    const redis = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisService

    return {
      service: new AuthService(prisma, jwtService, redis),
      prisma,
    }
  }

  it('updates the current profile and allows optional contacts to be cleared', async () => {
    const { service, prisma } = createAccountService()

    const result = await service.updateProfile(1, {
      username: 'admin-new',
      email: null,
      phone: null,
    })

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: {
        username: 'admin-new',
        email: null,
        phone: null,
      },
    }))
    expect(result).toEqual(expect.objectContaining({
      username: 'admin-new',
      email: null,
      phone: null,
      permissions: ['admin:dashboard:view', 'admin:profile:update'],
    }))
  })

  it('paginates security logs with safe page and pageSize bounds', async () => {
    const { service, prisma } = createAccountService()

    const result = await service.getSecurityLogs(1, 0, 200)

    expect(prisma.loginLog.count).toHaveBeenCalledWith({
      where: { userId: 1 },
    })
    expect(prisma.loginLog.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 100,
    })
    expect(result).toEqual(expect.objectContaining({
      total: 12,
      page: 1,
      pageSize: 100,
    }))
  })
})

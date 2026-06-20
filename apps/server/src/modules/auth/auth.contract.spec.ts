import type { JwtService } from '@nestjs/jwt'
import type { PrismaService } from '../../prisma/prisma.service'
import type { RedisService } from '../../redis/redis.service'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { validate } from 'class-validator'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

describe('admin login API contract', () => {
  const passwordHash = bcrypt.hashSync('admin123', 10)

  function createService() {
    const user = {
      id: 1,
      username: 'admin',
      password: passwordHash,
      email: 'admin@example.com',
      phone: '13800138000',
      avatar: null,
      status: 1,
      role: 'admin',
      permissions: ['user:own'],
      tenant: {
        id: 10,
        code: 'default',
        name: 'Default Tenant',
        status: 'ACTIVE',
      },
      dataScope: 'SHOP',
      boundShopIds: ['shop-1'],
    }

    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
      },
      role: {
        findUnique: jest.fn().mockResolvedValue({
          permissions: ['dashboard:view'],
          status: 1,
        }),
      },
      loginLog: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    }

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    }

    const redis = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    }

    return {
      jwtService,
      prisma,
      redis,
      service: new AuthService(
        prisma as unknown as PrismaService,
        jwtService as unknown as JwtService,
        redis as unknown as RedisService,
        {
          createSecurityLoginNotification: jest.fn().mockResolvedValue({} as any),
        } as any,
      ),
    }
  }

  it('accepts the current account field and the legacy username field', async () => {
    const byAccount = Object.assign(new LoginDto(), {
      account: 'admin',
      password: 'admin123',
    })
    const byUsername = Object.assign(new LoginDto(), {
      username: 'admin',
      password: 'admin123',
    })

    await expect(validate(byAccount)).resolves.toHaveLength(0)
    await expect(validate(byUsername)).resolves.toHaveLength(0)
  })

  it('rejects requests without any login account identifier', async () => {
    const dto = Object.assign(new LoginDto(), {
      password: 'admin123',
    })

    const errors = await validate(dto)

    expect(errors.map(error => error.property)).toContain('account')
  })

  it('passes legacy username requests to the auth service without changing the response contract', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        token: 'signed-token',
        expiresIn: 86400,
        user: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          phone: '13800138000',
          avatar: null,
          status: 1,
          role: 'admin',
          permissions: ['dashboard:view'],
          tenant: null,
          dataScope: 'ALL',
          boundShopIds: [],
        },
      }),
    }
    const controller = new AuthController(authService as unknown as AuthService)

    const result = await controller.login(
      {
        username: 'admin',
        password: 'admin123',
      },
      {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Vitest',
        },
      },
    )

    expect(authService.login).toHaveBeenCalledWith('admin', 'admin123', '127.0.0.1', 'Vitest', undefined)
    expect(result).toEqual(expect.objectContaining({
      expiresIn: 86400,
      token: 'signed-token',
      user: expect.objectContaining({
        boundShopIds: [],
        dataScope: 'ALL',
        permissions: ['dashboard:view'],
        tenant: null,
      }),
    }))
  })

  it('returns the login data shape consumed by web-admin', async () => {
    const { jwtService, redis, service } = createService()

    const result = await service.login('admin', 'admin123', '127.0.0.1', 'Vitest', true)

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    }, { expiresIn: '7d' })
    expect(redis.set).toHaveBeenCalledWith(
      'admin:online:1',
      expect.objectContaining({
        ip: '127.0.0.1',
        username: 'admin',
      }),
      7 * 24 * 60 * 60,
    )
    expect(result).toStrictEqual({
      token: 'signed-token',
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        phone: '13800138000',
        avatar: null,
        status: 1,
        role: 'admin',
        permissions: ['dashboard:view', 'user:own'],
        tenant: {
          id: 10,
          code: 'default',
          name: 'Default Tenant',
          status: 'ACTIVE',
        },
        dataScope: 'SHOP',
        boundShopIds: ['shop-1'],
      },
    })
  })

  it('keeps credential failures behind a generic unauthorized error', async () => {
    const { service } = createService()

    await expect(service.login('admin', 'wrong-password')).rejects.toThrow(UnauthorizedException)
  })
})

import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { PrismaService } from '../../../prisma/prisma.service'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { RolesGuard } from './roles.guard'

interface GuardOptions {
  requiredRoles?: string[]
  requiredPermissions?: string[]
  requestUser?: {
    id?: number
    subjectType?: string
  }
  currentUser?: {
    role: string
    permissions?: string[] | null
    status: number
  } | null
  roleRecord?: {
    permissions?: string[] | null
    status: number
  } | null
}

function createExecutionContext(requestUser?: {
  id?: number
  subjectType?: string
}): ExecutionContext {
  const user = requestUser?.id
    ? {
        subjectType: 'admin',
        ...requestUser,
      }
    : requestUser

  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: () => ({ user }),
    })),
  } as unknown as ExecutionContext
}

function createGuard(options: GuardOptions = {}) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === ROLES_KEY) {
        return options.requiredRoles
      }

      if (key === PERMISSIONS_KEY) {
        return options.requiredPermissions
      }

      return undefined
    }),
  } as unknown as Reflector

  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(options.currentUser ?? null),
    },
    role: {
      findUnique: jest.fn().mockResolvedValue(options.roleRecord ?? null),
    },
  } as unknown as PrismaService

  return {
    guard: new RolesGuard(reflector, prisma),
    context: createExecutionContext(options.requestUser),
    prisma,
  }
}

describe('rolesGuard', () => {
  it('allows requests when a route has no role or permission metadata', async () => {
    const { guard, context, prisma } = createGuard()

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects protected routes when the request has no authenticated user id', async () => {
    const { guard, context, prisma } = createGuard({
      requiredRoles: ['admin'],
    })

    await expect(guard.canActivate(context)).resolves.toBe(false)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects customer subjects before loading admin role data', async () => {
    const { guard, context, prisma } = createGuard({
      requiredRoles: ['admin'],
      requestUser: {
        id: 7,
        subjectType: 'customer',
      },
      currentUser: {
        role: 'admin',
        permissions: ['*:*:*'],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(false)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects missing or disabled users', async () => {
    const missing = createGuard({
      requiredRoles: ['admin'],
      requestUser: { id: 1 },
      currentUser: null,
    })
    const disabled = createGuard({
      requiredRoles: ['admin'],
      requestUser: { id: 2 },
      currentUser: {
        role: 'admin',
        permissions: ['system:user:list'],
        status: 0,
      },
    })

    await expect(missing.guard.canActivate(missing.context)).resolves.toBe(false)
    await expect(disabled.guard.canActivate(disabled.context)).resolves.toBe(false)
  })

  it('allows users whose role and permissions satisfy the route metadata', async () => {
    const { guard, context, prisma } = createGuard({
      requiredRoles: ['admin'],
      requiredPermissions: ['system:user:list', 'system:user:create'],
      requestUser: { id: 7 },
      currentUser: {
        role: 'admin',
        permissions: ['system:user:list', 'system:user:create'],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: {
        role: true,
        permissions: true,
        status: true,
      },
    })
  })

  it('allows role-only routes when the stored role matches', async () => {
    const { guard, context } = createGuard({
      requiredRoles: ['admin'],
      requestUser: { id: 6 },
      currentUser: {
        role: 'admin',
        permissions: [],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)
  })

  it('requires matching role metadata even when permissions pass', async () => {
    const { guard, context } = createGuard({
      requiredRoles: ['admin'],
      requiredPermissions: ['system:user:list'],
      requestUser: { id: 10 },
      currentUser: {
        role: 'user',
        permissions: ['system:user:list', '*:*:*'],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(false)
  })

  it('allows wildcard permissions to satisfy every required permission', async () => {
    const { guard, context } = createGuard({
      requiredPermissions: ['system:user:delete'],
      requestUser: { id: 8 },
      currentUser: {
        role: 'user',
        permissions: ['*:*:*'],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)
  })

  it('allows permission routes when the enabled role grants the required permission', async () => {
    const { guard, context, prisma } = createGuard({
      requiredPermissions: ['permission:page:view'],
      requestUser: { id: 12 },
      currentUser: {
        role: 'user',
        permissions: [],
        status: 1,
      },
      roleRecord: {
        permissions: ['permission:page:view'],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(true)
    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { code: 'user' },
      select: {
        permissions: true,
        status: true,
      },
    })
  })

  it('rejects permission routes when stored permissions are missing', async () => {
    const { guard, context } = createGuard({
      requiredPermissions: ['system:user:list'],
      requestUser: { id: 11 },
      currentUser: {
        role: 'admin',
        permissions: null,
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(false)
  })

  it('rejects users that miss any required permission', async () => {
    const { guard, context } = createGuard({
      requiredPermissions: ['system:user:list', 'system:user:delete'],
      requestUser: { id: 9 },
      currentUser: {
        role: 'admin',
        permissions: ['system:user:list'],
        status: 1,
      },
    })

    await expect(guard.canActivate(context)).resolves.toBe(false)
  })
})

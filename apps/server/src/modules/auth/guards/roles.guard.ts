import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { PrismaService } from '../../../prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (
      (!requiredRoles || requiredRoles.length === 0)
      && (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()
    if (!user?.id) {
      return false
    }

    if (user.subjectType !== 'admin') {
      return false
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, permissions: true, status: true },
    })

    if (!currentUser || currentUser.status !== 1) {
      return false
    }

    const rolePassed
      = !requiredRoles || requiredRoles.length === 0 || requiredRoles.includes(currentUser.role)
    const effectivePermissions = requiredPermissions?.length
      ? await this.resolveEffectivePermissions(currentUser)
      : currentUser.permissions
    const permissionPassed
      = !requiredPermissions
        || requiredPermissions.length === 0
        || this.hasPermissions(effectivePermissions, requiredPermissions)

    return rolePassed && permissionPassed
  }

  private async resolveEffectivePermissions(user: { role?: string | null, permissions?: string[] | null }) {
    const rolePermissions = await this.getRolePermissions(user.role)
    return Array.from(new Set([...rolePermissions, ...(user.permissions ?? [])]))
  }

  private async getRolePermissions(roleCode?: string | null) {
    if (!roleCode) {
      return []
    }

    try {
      const role = await (this.prisma as any).role.findUnique({
        where: { code: roleCode },
        select: { permissions: true, status: true },
      })

      if (!role || role.status !== 1) {
        return []
      }

      return role.permissions ?? []
    }
    catch {
      return []
    }
  }

  private hasPermissions(
    userPermissions: string[] | null | undefined,
    requiredPermissions: string[],
  ) {
    const permissions = userPermissions ?? []

    if (permissions.includes('*:*:*')) {
      return true
    }

    return requiredPermissions.every(permission => permissions.includes(permission))
  }
}

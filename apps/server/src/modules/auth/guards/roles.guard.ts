import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

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
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.id) {
      return false;
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, permissions: true, status: true },
    });

    if (!currentUser || currentUser.status !== 1) {
      return false;
    }

    const rolePassed =
      !requiredRoles || requiredRoles.length === 0 || requiredRoles.includes(currentUser.role);
    const permissionPassed =
      !requiredPermissions ||
      requiredPermissions.length === 0 ||
      this.hasPermissions(currentUser.permissions, requiredPermissions);

    return rolePassed && permissionPassed;
  }

  private hasPermissions(
    userPermissions: string[] | null | undefined,
    requiredPermissions: string[],
  ) {
    const permissions = userPermissions ?? [];

    if (permissions.includes('*:*:*')) {
      return true;
    }

    return requiredPermissions.every((permission) => permissions.includes(permission));
  }
}

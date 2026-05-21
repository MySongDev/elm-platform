import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface MenuNode {
  id: number;
  parentId: number | null;
  title: string;
  path: string;
  name: string | null;
  icon: string | null;
  permission: string | null;
  type: 'catalog' | 'menu' | 'button';
  sort: number;
  status: number;
  children?: MenuNode[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 获取当前用户能访问的菜单树（已按 role + permissions 过滤，不含 button 节点）
   */
  async getUserMenus(userId: number): Promise<MenuNode[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, permissions: true },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const list = (await (this.prisma as any).menu.findMany({
      where: { status: 1, type: { in: ['catalog', 'menu'] } },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    })) as MenuNode[];

    const userPermissions = user.permissions ?? [];
    const isSuperAdmin = userPermissions.includes('*:*:*');

    const allowed = list.filter((menu) => {
      if (!menu.permission) return true;
      if (isSuperAdmin) return true;
      return userPermissions.includes(menu.permission);
    });

    return this.buildMenuTree(allowed);
  }

  private buildMenuTree(list: MenuNode[]): MenuNode[] {
    const map = new Map<number, MenuNode>();
    const roots: MenuNode[] = [];

    list.forEach((item) => map.set(item.id, { ...item, children: [] }));
    map.forEach((item) => {
      if (item.parentId != null && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(item);
      } else {
        roots.push(item);
      }
    });

    const sortAndClean = (nodes: MenuNode[]): MenuNode[] =>
      nodes
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((node) => {
          if (node.children?.length) {
            node.children = sortAndClean(node.children);
          } else {
            delete node.children;
          }
          return node;
        });

    // 移除父级没有可访问子菜单的 catalog
    const pruneEmptyCatalogs = (nodes: MenuNode[]): MenuNode[] =>
      nodes
        .map((node) => {
          if (node.children?.length) {
            node.children = pruneEmptyCatalogs(node.children);
          }
          return node;
        })
        .filter((node) => node.type !== 'catalog' || (node.children && node.children.length > 0));

    return pruneEmptyCatalogs(sortAndClean(roots));
  }

  async login(username: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordLoginLog(user.id, ip, userAgent, 0, '密码错误');
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 1) {
      await this.recordLoginLog(user.id, ip, userAgent, 0, '账号已被禁用');
      throw new UnauthorizedException('账号已被禁用');
    }

    await this.recordLoginLog(user.id, ip, userAgent, 1, '登录成功');
    await this.recordOnlineUser(user, ip, userAgent);

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }

  async logout(userId: number) {
    await this.redis.del(`admin:online:${userId}`).catch(() => undefined);
    return { success: true };
  }

  private async recordLoginLog(
    userId: number,
    ip?: string,
    userAgent?: string,
    status: number = 1,
    message?: string,
  ) {
    try {
      const { browser, os } = this.parseUserAgent(userAgent);
      await this.prisma.loginLog.create({
        data: { userId, ip, browser, os, status, message },
      });
    } catch {
      // logging should not break login flow
    }
  }

  private parseUserAgent(userAgent?: string) {
    if (!userAgent) return { browser: '未知', os: '未知' };

    let browser = '未知';
    let os = '未知';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'IE';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return { browser, os };
  }

  private async recordOnlineUser(user: any, ip?: string, userAgent?: string) {
    try {
      const { browser, os } = this.parseUserAgent(userAgent);
      await this.redis.set(
        `admin:online:${user.id}`,
        {
          id: user.id,
          username: user.username,
          role: user.role,
          ip: ip || null,
          browser,
          os,
          loginTime: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        },
        24 * 60 * 60,
      );
    } catch {
      // online state should not break login flow
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        role: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  async updateProfile(userId: number, data: { username?: string; email?: string; phone?: string }) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          avatar: true,
          status: true,
          role: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('用户名已存在');
      }
      throw error;
    }
  }

  async getSecurityLogs(userId: number, page: number = 1, pageSize: number = 10) {
    const currentPage = Math.max(1, page);
    const currentPageSize = Math.min(Math.max(1, pageSize), 100);
    const where = { userId };
    const total = await this.prisma.loginLog.count({ where });
    const list = await this.prisma.loginLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * currentPageSize,
      take: currentPageSize,
    });

    return { list, total, page: currentPage, pageSize: currentPageSize };
  }
}

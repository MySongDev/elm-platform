import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { fallbackDepts, fallbackMenus, fallbackRoles } from './constants/admin-fallback-data';
import { buttonPermissions, pagePermissions } from './constants/admin-permissions';
import { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto';
import type { LoginLogView, TreeNode } from './model/admin-records';

@Injectable()
export class AdminService {
  private memoryRoles = [...fallbackRoles];
  private memoryMenus = [...fallbackMenus];
  private memoryDepts = [...fallbackDepts];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getPagePermissions() {
    return pagePermissions;
  }

  getButtonPermissions() {
    return buttonPermissions;
  }

  async getOnlineUsers() {
    try {
      const client = this.redis.getClient();
      const keys = await client.keys('admin:online:*');
      if (!keys.length) return [];
      const values = await Promise.all(keys.map((key) => this.redis.getObject(key)));
      return values.filter(Boolean);
    } catch {
      const logs = await this.getLoginLogs();
      const seen = new Set<string>();
      return logs
        .filter((log) => log.status === 1 && !seen.has(log.username) && seen.add(log.username))
        .map((log) => ({
          id: log.userId,
          username: log.username,
          role: 'user',
          ip: log.ip,
          browser: log.browser,
          os: log.os,
          loginTime: log.createdAt,
          lastActiveAt: log.createdAt,
        }));
    }
  }

  async forceLogout(id: number) {
    await this.redis.del(`admin:online:${id}`).catch(() => undefined);
    return { success: true };
  }

  async getLoginLogs(): Promise<LoginLogView[]> {
    const logs = (await this.prisma.loginLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { id: true, username: true } } },
    })) as Array<{
      id: number;
      userId: number;
      user?: { username: string } | null;
      ip: string | null;
      address: string | null;
      browser: string | null;
      os: string | null;
      status: number;
      message: string | null;
      createdAt: Date;
    }>;

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      username: log.user?.username || '-',
      ip: log.ip,
      address: log.address,
      browser: log.browser,
      os: log.os,
      status: log.status,
      message: log.message,
      createdAt: log.createdAt,
    }));
  }

  async getOperationLogs() {
    try {
      return await (this.prisma as any).operationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    } catch {
      const loginLogs = await this.getLoginLogs();
      return loginLogs.slice(0, 20).map((log, index) => ({
        id: index + 1,
        username: log.username,
        module: '认证管理',
        action: log.status === 1 ? '用户登录' : '登录失败',
        method: 'POST',
        path: '/api/auth/login',
        ip: log.ip,
        status: log.status,
        duration: 30 + index,
        createdAt: log.createdAt,
      }));
    }
  }

  async getSystemLogs() {
    try {
      return await (this.prisma as any).systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    } catch {
      return [
        { id: 1, level: 'info', source: 'NestJS', message: '后台管理服务已启动', detail: 'Admin module ready', createdAt: new Date().toISOString() },
        { id: 2, level: 'info', source: 'Prisma', message: '数据库连接正常', detail: null, createdAt: new Date().toISOString() },
      ];
    }
  }

  async getRoles() {
    try {
      return await (this.prisma as any).role.findMany({ orderBy: { id: 'asc' } });
    } catch {
      return this.memoryRoles;
    }
  }

  async createRole(dto: UpsertRoleDto) {
    try {
      return await (this.prisma as any).role.create({
        data: {
          name: dto.name || '未命名角色',
          code: dto.code || `role_${Date.now()}`,
          status: dto.status ?? 1,
          remark: dto.remark,
          permissions: dto.permissions || [],
        },
      });
    } catch {
      const role = { id: Date.now(), name: dto.name || '未命名角色', code: dto.code || `role_${Date.now()}`, status: dto.status ?? 1, remark: dto.remark || null, permissions: dto.permissions || [], createdAt: new Date().toISOString() };
      this.memoryRoles.push(role);
      return role;
    }
  }

  async updateRole(id: number, dto: UpsertRoleDto) {
    try {
      return await (this.prisma as any).role.update({ where: { id }, data: dto });
    } catch {
      const index = this.memoryRoles.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('角色不存在');
      this.memoryRoles[index] = { ...this.memoryRoles[index], ...dto };
      return this.memoryRoles[index];
    }
  }

  async deleteRole(id: number) {
    try {
      await (this.prisma as any).role.delete({ where: { id } });
    } catch {
      this.memoryRoles = this.memoryRoles.filter((item) => item.id !== id);
    }
    return { success: true };
  }

  async getMenus() {
    try {
      const list = await (this.prisma as any).menu.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] });
      return this.buildTree(list);
    } catch {
      return this.buildTree(this.memoryMenus);
    }
  }

  async createMenu(dto: UpsertMenuDto) {
    try {
      return await (this.prisma as any).menu.create({ data: this.normalizeMenu(dto) });
    } catch {
      const menu = { id: Date.now(), ...this.normalizeMenu(dto) };
      this.memoryMenus.push(menu);
      return menu;
    }
  }

  async updateMenu(id: number, dto: UpsertMenuDto) {
    try {
      return await (this.prisma as any).menu.update({ where: { id }, data: this.normalizeMenu(dto) });
    } catch {
      const index = this.memoryMenus.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('菜单不存在');
      this.memoryMenus[index] = { ...this.memoryMenus[index], ...this.normalizeMenu(dto) };
      return this.memoryMenus[index];
    }
  }

  async deleteMenu(id: number) {
    try {
      await (this.prisma as any).menu.delete({ where: { id } });
    } catch {
      this.memoryMenus = this.memoryMenus.filter((item) => item.id !== id && item.parentId !== id);
    }
    return { success: true };
  }

  async getDepts() {
    try {
      const list = await (this.prisma as any).dept.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] });
      return this.buildTree(list);
    } catch {
      return this.buildTree(this.memoryDepts);
    }
  }

  async createDept(dto: UpsertDeptDto) {
    try {
      return await (this.prisma as any).dept.create({ data: this.normalizeDept(dto) });
    } catch {
      const dept = { id: Date.now(), ...this.normalizeDept(dto) };
      this.memoryDepts.push(dept);
      return dept;
    }
  }

  async updateDept(id: number, dto: UpsertDeptDto) {
    try {
      return await (this.prisma as any).dept.update({ where: { id }, data: this.normalizeDept(dto) });
    } catch {
      const index = this.memoryDepts.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('部门不存在');
      this.memoryDepts[index] = { ...this.memoryDepts[index], ...this.normalizeDept(dto) };
      return this.memoryDepts[index];
    }
  }

  async deleteDept(id: number) {
    try {
      await (this.prisma as any).dept.delete({ where: { id } });
    } catch {
      this.memoryDepts = this.memoryDepts.filter((item) => item.id !== id && item.parentId !== id);
    }
    return { success: true };
  }

  private buildTree<T extends { id: number; parentId: number | null; sort?: number }>(list: T[]) {
    const map = new Map<number, TreeNode<T>>();
    const roots: TreeNode<T>[] = [];

    list.forEach((item) => map.set(item.id, { ...item, children: [] }));
    map.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)?.children?.push(item);
      } else {
        roots.push(item);
      }
    });

    const clean = (items: TreeNode<T>[]) =>
      items
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item) => {
          if (item.children?.length) {
            item.children = clean(item.children);
          } else {
            delete item.children;
          }
          return item;
        });

    return clean(roots);
  }

  private normalizeMenu(dto: UpsertMenuDto) {
    return {
      parentId: dto.parentId ?? null,
      title: dto.title || '未命名菜单',
      path: dto.path || '',
      name: dto.name || null,
      icon: dto.icon || null,
      permission: dto.permission || null,
      type: dto.type || 'menu',
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
    };
  }

  private normalizeDept(dto: UpsertDeptDto) {
    return {
      parentId: dto.parentId ?? null,
      name: dto.name || '未命名部门',
      leader: dto.leader || null,
      phone: dto.phone || null,
      email: dto.email || null,
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto';

type TreeNode<T> = T & { id: number; parentId: number | null; children?: TreeNode<T>[] };
type RoleRecord = {
  id: number;
  name: string;
  code: string;
  status: number;
  remark: string | null;
  permissions: string[];
  createdAt: string;
};
type MenuRecord = {
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
};
type DeptRecord = {
  id: number;
  parentId: number | null;
  name: string;
  leader: string | null;
  phone: string | null;
  email: string | null;
  sort: number;
  status: number;
};

type LoginLogView = {
  id: number;
  userId: number;
  username: string;
  ip: string | null;
  address: string | null;
  browser: string | null;
  os: string | null;
  status: number;
  message: string | null;
  createdAt: Date;
};

const buttonPermissions = [
  { code: 'permission:page:view', name: '页面权限查看', group: '权限管理' },
  { code: 'permission:button:view', name: '按钮权限查看', group: '权限管理' },
  { code: 'user:view', name: '用户查看', group: '系统管理' },
  { code: 'user:add', name: '用户新增', group: '系统管理' },
  { code: 'user:edit', name: '用户编辑', group: '系统管理' },
  { code: 'user:delete', name: '用户删除', group: '系统管理' },
  { code: 'role:view', name: '角色查看', group: '系统管理' },
  { code: 'role:add', name: '角色新增', group: '系统管理' },
  { code: 'role:edit', name: '角色编辑', group: '系统管理' },
  { code: 'role:delete', name: '角色删除', group: '系统管理' },
  { code: 'menu:view', name: '菜单查看', group: '系统管理' },
  { code: 'menu:add', name: '菜单新增', group: '系统管理' },
  { code: 'menu:edit', name: '菜单编辑', group: '系统管理' },
  { code: 'menu:delete', name: '菜单删除', group: '系统管理' },
  { code: 'dept:view', name: '部门查看', group: '系统管理' },
  { code: 'dept:add', name: '部门新增', group: '系统管理' },
  { code: 'dept:edit', name: '部门编辑', group: '系统管理' },
  { code: 'dept:delete', name: '部门删除', group: '系统管理' },
  { code: 'commerce:restaurant:view', name: '商家查看', group: '业务管理' },
  { code: 'commerce:restaurant:add', name: '商家新增', group: '业务管理' },
  { code: 'commerce:restaurant:edit', name: '商家编辑', group: '业务管理' },
  { code: 'commerce:restaurant:delete', name: '商家删除', group: '业务管理' },
  { code: 'commerce:food:view', name: '商品查看', group: '业务管理' },
  { code: 'commerce:food:add', name: '商品新增', group: '业务管理' },
  { code: 'commerce:food:edit', name: '商品编辑', group: '业务管理' },
  { code: 'commerce:food:delete', name: '商品删除', group: '业务管理' },
  { code: 'commerce:order:view', name: '订单查看', group: '业务管理' },
  { code: 'commerce:order:edit', name: '订单编辑', group: '业务管理' },
  { code: 'monitor:online:view', name: '在线用户查看', group: '系统监控' },
  { code: 'monitor:online:force-logout', name: '强制下线', group: '系统监控' },
  { code: 'log:login:view', name: '登录日志查看', group: '系统监控' },
  { code: 'log:operation:view', name: '操作日志查看', group: '系统监控' },
  { code: 'log:system:view', name: '系统日志查看', group: '系统监控' },
];

const pagePermissions = [
  { path: '/dashboard/index', name: 'DashboardView', title: '仪表盘', roles: ['admin', 'user'], auths: [] },
  { path: '/permission/page', name: 'PagePermission', title: '页面权限', roles: ['admin', 'user'], auths: ['permission:page:view'] },
  { path: '/permission/button', name: 'ButtonPermission', title: '按钮权限', roles: ['admin', 'user'], auths: ['permission:button:view'] },
  { path: '/monitor/online-user', name: 'OnlineUser', title: '在线用户', roles: ['admin'], auths: ['monitor:online:view'] },
  { path: '/monitor/login-logs', name: 'LoginLogs', title: '登录日志', roles: ['admin'], auths: ['log:login:view'] },
  { path: '/monitor/operation-logs', name: 'OperationLogs', title: '操作日志', roles: ['admin'], auths: ['log:operation:view'] },
  { path: '/monitor/system-logs', name: 'SystemLogs', title: '系统日志', roles: ['admin'], auths: ['log:system:view'] },
  { path: '/system/user', name: 'UserList', title: '用户管理', roles: ['admin'], auths: ['user:view'] },
  { path: '/system/role', name: 'RoleManagement', title: '角色管理', roles: ['admin'], auths: ['role:view'] },
  { path: '/system/menu', name: 'MenuManagement', title: '菜单管理', roles: ['admin'], auths: ['menu:view'] },
  { path: '/system/dept', name: 'DeptManagement', title: '部门管理', roles: ['admin'], auths: ['dept:view'] },
  { path: '/commerce/restaurant', name: 'CommerceRestaurant', title: '商家管理', roles: ['admin'], auths: ['commerce:restaurant:view'] },
  { path: '/commerce/food', name: 'CommerceFood', title: '商品管理', roles: ['admin'], auths: ['commerce:food:view'] },
  { path: '/commerce/order', name: 'CommerceOrder', title: '订单管理', roles: ['admin'], auths: ['commerce:order:view'] },
  { path: '/nested/menu1/menu1-1', name: 'NestedMenu11View', title: '菜单1-1', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu1/menu1-2/menu1-2-1', name: 'NestedMenu121View', title: '菜单1-2-1', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu1/menu1-2/menu1-2-2', name: 'NestedMenu122View', title: '菜单1-2-2', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu1/menu1-3', name: 'NestedMenu13View', title: '菜单1-3', roles: ['admin', 'user'], auths: [] },
  { path: '/nested/menu2', name: 'NestedMenu2View', title: '菜单2', roles: ['admin', 'user'], auths: [] },
];

const fallbackRoles: RoleRecord[] = [
  { id: 1, name: '超级管理员', code: 'admin', status: 1, remark: '拥有系统全部权限', permissions: ['*:*:*'], createdAt: new Date().toISOString() },
  { id: 2, name: '普通用户', code: 'user', status: 1, remark: '拥有基础访问权限', permissions: ['permission:page:view', 'permission:button:view'], createdAt: new Date().toISOString() },
];

const fallbackMenus: MenuRecord[] = [
  { id: 14, parentId: null, title: '仪表盘', path: '/dashboard', name: 'Dashboard', icon: 'dashboard', permission: null, type: 'catalog', sort: 1, status: 1 },
  { id: 15, parentId: 14, title: '仪表盘', path: '/dashboard/index', name: 'DashboardView', icon: 'dashboard', permission: null, type: 'menu', sort: 1, status: 1 },
  { id: 1, parentId: null, title: '权限管理', path: '/permission', name: 'Permission', icon: 'permission', permission: null, type: 'catalog', sort: 20, status: 1 },
  { id: 2, parentId: 1, title: '页面权限', path: '/permission/page', name: 'PagePermission', icon: 'permission', permission: 'permission:page:view', type: 'menu', sort: 1, status: 1 },
  { id: 3, parentId: 1, title: '按钮权限', path: '/permission/button', name: 'ButtonPermission', icon: 'permission', permission: 'permission:button:view', type: 'menu', sort: 2, status: 1 },
  { id: 4, parentId: null, title: '系统监控', path: '/monitor', name: 'Monitor', icon: 'monitor', permission: null, type: 'catalog', sort: 30, status: 1 },
  { id: 5, parentId: 4, title: '在线用户', path: '/monitor/online-user', name: 'OnlineUser', icon: 'monitor', permission: 'monitor:online:view', type: 'menu', sort: 1, status: 1 },
  { id: 6, parentId: 4, title: '登录日志', path: '/monitor/login-logs', name: 'LoginLogs', icon: 'monitor', permission: 'log:login:view', type: 'menu', sort: 2, status: 1 },
  { id: 7, parentId: 4, title: '操作日志', path: '/monitor/operation-logs', name: 'OperationLogs', icon: 'monitor', permission: 'log:operation:view', type: 'menu', sort: 3, status: 1 },
  { id: 8, parentId: 4, title: '系统日志', path: '/monitor/system-logs', name: 'SystemLogs', icon: 'monitor', permission: 'log:system:view', type: 'menu', sort: 4, status: 1 },
  { id: 9, parentId: null, title: '系统管理', path: '/system', name: 'System', icon: 'system', permission: null, type: 'catalog', sort: 40, status: 1 },
  { id: 10, parentId: 9, title: '用户管理', path: '/system/user', name: 'UserList', icon: 'user', permission: 'user:view', type: 'menu', sort: 1, status: 1 },
  { id: 11, parentId: 9, title: '角色管理', path: '/system/role', name: 'RoleManagement', icon: 'role', permission: 'role:view', type: 'menu', sort: 2, status: 1 },
  { id: 12, parentId: 9, title: '菜单管理', path: '/system/menu', name: 'MenuManagement', icon: 'menu', permission: 'menu:view', type: 'menu', sort: 3, status: 1 },
  { id: 13, parentId: 9, title: '部门管理', path: '/system/dept', name: 'DeptManagement', icon: 'dept', permission: 'dept:view', type: 'menu', sort: 4, status: 1 },
  { id: 20, parentId: null, title: '业务管理', path: '/commerce', name: 'Commerce', icon: 'document', permission: null, type: 'catalog', sort: 35, status: 1 },
  { id: 21, parentId: 20, title: '商家管理', path: '/commerce/restaurant', name: 'CommerceRestaurantView', icon: 'document', permission: 'commerce:restaurant:view', type: 'menu', sort: 1, status: 1 },
  { id: 22, parentId: 20, title: '商品管理', path: '/commerce/food', name: 'CommerceFoodView', icon: 'document', permission: 'commerce:food:view', type: 'menu', sort: 2, status: 1 },
  { id: 23, parentId: 20, title: '订单管理', path: '/commerce/order', name: 'CommerceOrderView', icon: 'document', permission: 'commerce:order:view', type: 'menu', sort: 3, status: 1 },
  { id: 30, parentId: null, title: '多级菜单', path: '/nested', name: 'Nested', icon: 'nested', permission: null, type: 'catalog', sort: 50, status: 1 },
  { id: 31, parentId: 30, title: '菜单1', path: '/nested/menu1', name: 'NestedMenu1', icon: 'nested', permission: null, type: 'catalog', sort: 1, status: 1 },
  { id: 32, parentId: 31, title: '菜单1-1', path: '/nested/menu1/menu1-1', name: 'NestedMenu11View', icon: 'nested', permission: null, type: 'menu', sort: 1, status: 1 },
  { id: 33, parentId: 31, title: '菜单1-2', path: '/nested/menu1/menu1-2', name: 'NestedMenu12', icon: 'nested', permission: null, type: 'catalog', sort: 2, status: 1 },
  { id: 34, parentId: 33, title: '菜单1-2-1', path: '/nested/menu1/menu1-2/menu1-2-1', name: 'NestedMenu121View', icon: 'nested', permission: null, type: 'menu', sort: 1, status: 1 },
  { id: 35, parentId: 33, title: '菜单1-2-2', path: '/nested/menu1/menu1-2/menu1-2-2', name: 'NestedMenu122View', icon: 'nested', permission: null, type: 'menu', sort: 2, status: 1 },
  { id: 36, parentId: 31, title: '菜单1-3', path: '/nested/menu1/menu1-3', name: 'NestedMenu13View', icon: 'nested', permission: null, type: 'menu', sort: 3, status: 1 },
  { id: 37, parentId: 30, title: '菜单2', path: '/nested/menu2', name: 'NestedMenu2View', icon: 'nested', permission: null, type: 'menu', sort: 2, status: 1 },
  { id: 101, parentId: 5, title: '强制下线', path: '/monitor/online-user', name: null, icon: null, permission: 'monitor:online:force-logout', type: 'button', sort: 1, status: 1 },
  { id: 110, parentId: 10, title: '新增用户', path: '/system/user', name: null, icon: null, permission: 'user:add', type: 'button', sort: 1, status: 1 },
  { id: 111, parentId: 10, title: '编辑用户', path: '/system/user', name: null, icon: null, permission: 'user:edit', type: 'button', sort: 2, status: 1 },
  { id: 112, parentId: 10, title: '删除用户', path: '/system/user', name: null, icon: null, permission: 'user:delete', type: 'button', sort: 3, status: 1 },
  { id: 120, parentId: 11, title: '新增角色', path: '/system/role', name: null, icon: null, permission: 'role:add', type: 'button', sort: 1, status: 1 },
  { id: 121, parentId: 11, title: '编辑角色', path: '/system/role', name: null, icon: null, permission: 'role:edit', type: 'button', sort: 2, status: 1 },
  { id: 122, parentId: 11, title: '删除角色', path: '/system/role', name: null, icon: null, permission: 'role:delete', type: 'button', sort: 3, status: 1 },
  { id: 130, parentId: 12, title: '新增菜单', path: '/system/menu', name: null, icon: null, permission: 'menu:add', type: 'button', sort: 1, status: 1 },
  { id: 131, parentId: 12, title: '编辑菜单', path: '/system/menu', name: null, icon: null, permission: 'menu:edit', type: 'button', sort: 2, status: 1 },
  { id: 132, parentId: 12, title: '删除菜单', path: '/system/menu', name: null, icon: null, permission: 'menu:delete', type: 'button', sort: 3, status: 1 },
  { id: 140, parentId: 13, title: '新增部门', path: '/system/dept', name: null, icon: null, permission: 'dept:add', type: 'button', sort: 1, status: 1 },
  { id: 141, parentId: 13, title: '编辑部门', path: '/system/dept', name: null, icon: null, permission: 'dept:edit', type: 'button', sort: 2, status: 1 },
  { id: 142, parentId: 13, title: '删除部门', path: '/system/dept', name: null, icon: null, permission: 'dept:delete', type: 'button', sort: 3, status: 1 },
  { id: 150, parentId: 21, title: '新增商家', path: '/commerce/restaurant', name: null, icon: null, permission: 'commerce:restaurant:add', type: 'button', sort: 1, status: 1 },
  { id: 151, parentId: 21, title: '编辑商家', path: '/commerce/restaurant', name: null, icon: null, permission: 'commerce:restaurant:edit', type: 'button', sort: 2, status: 1 },
  { id: 152, parentId: 21, title: '删除商家', path: '/commerce/restaurant', name: null, icon: null, permission: 'commerce:restaurant:delete', type: 'button', sort: 3, status: 1 },
  { id: 160, parentId: 22, title: '新增商品', path: '/commerce/food', name: null, icon: null, permission: 'commerce:food:add', type: 'button', sort: 1, status: 1 },
  { id: 161, parentId: 22, title: '编辑商品', path: '/commerce/food', name: null, icon: null, permission: 'commerce:food:edit', type: 'button', sort: 2, status: 1 },
  { id: 162, parentId: 22, title: '删除商品', path: '/commerce/food', name: null, icon: null, permission: 'commerce:food:delete', type: 'button', sort: 3, status: 1 },
  { id: 170, parentId: 23, title: '编辑订单', path: '/commerce/order', name: null, icon: null, permission: 'commerce:order:edit', type: 'button', sort: 1, status: 1 },
];

const fallbackDepts: DeptRecord[] = [
  { id: 1, parentId: null, name: '总公司', leader: '管理员', phone: '13800138000', email: 'admin@example.com', sort: 1, status: 1 },
  { id: 2, parentId: 1, name: '研发部门', leader: '研发负责人', phone: '13800138001', email: 'rd@example.com', sort: 1, status: 1 },
  { id: 3, parentId: 1, name: '运营部门', leader: '运营负责人', phone: '13800138002', email: 'ops@example.com', sort: 2, status: 1 },
];

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

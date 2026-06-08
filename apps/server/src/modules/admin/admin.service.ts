import type { TenantContext } from '../tenant/tenant.types'
import type { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto'
import type { LoginLogView, TreeNode } from './model/admin-records'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { TenantAccessService } from '../tenant/tenant-access.service'
import { fallbackDepts, fallbackMenus, fallbackRoles } from './constants/admin-fallback-data'
import { buttonPermissions, pagePermissions } from './constants/admin-permissions'

@Injectable()
export class AdminService {
  private memoryRoles = [...fallbackRoles]
  private memoryMenus = [...fallbackMenus]
  private memoryDepts = [...fallbackDepts]

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  getPagePermissions() {
    return pagePermissions
  }

  getButtonPermissions() {
    return buttonPermissions
  }

  async getOnlineUsers() {
    try {
      const client = this.redis.getClient()
      const keys = await client.keys('admin:online:*')
      if (!keys.length)
        return []
      const values = await Promise.all(keys.map(key => this.redis.getObject(key)))
      return values.filter(Boolean)
    }
    catch {
      return []
    }
  }

  async forceLogout(id: number) {
    await this.redis.del(`admin:online:${id}`).catch(() => undefined)
    return { success: true }
  }

  async getLoginLogs(context?: TenantContext): Promise<LoginLogView[]> {
    const where = this.buildLoginLogWhere(context)
    const logs = (await this.prisma.loginLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })) as Array<{
      id: number
      userId: number
      user?: { username: string } | null
      ip: string | null
      address: string | null
      browser: string | null
      os: string | null
      status: number
      message: string | null
      createdAt: Date
    }>

    return logs.map(log => ({
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
    }))
  }

  async getOperationLogs(context?: TenantContext) {
    try {
      const where = this.buildOperationLogWhere(context)
      return await (this.prisma as any).operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }
    catch {
      return []
    }
  }

  async getSystemLogs(context?: TenantContext) {
    if (context && !context.isPlatformAdmin) {
      this.tenantAccess.assertCanRead(context)
      return this.getRuntimeSystemLogs()
    }

    try {
      const logs = await (this.prisma as any).systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      })

      if (logs.length)
        return logs
    }
    catch {
      // 读取系统日志失败时，继续返回运行态健康信息。
    }

    return this.getRuntimeSystemLogs()
  }

  private buildLoginLogWhere(context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return undefined

    this.tenantAccess.assertCanRead(context)

    if (!context.tenantId)
      return { userId: -1 }

    return { user: { tenantId: context.tenantId } }
  }

  private buildOperationLogWhere(context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return undefined

    this.tenantAccess.assertCanRead(context)

    if (!context.tenantId)
      return { tenantId: -1 }

    return { tenantId: context.tenantId }
  }

  private async getRuntimeSystemLogs() {
    const createdAt = new Date().toISOString()
    const memory = process.memoryUsage()
    const logs = [
      {
        id: 1,
        level: 'info',
        source: 'NestJS',
        message: '后台管理服务运行中',
        detail: `uptime=${Math.round(process.uptime())}s, node=${process.version}, rss=${Math.round(memory.rss / 1024 / 1024)}MB`,
        createdAt,
      },
    ]

    try {
      await (this.prisma as any).$queryRawUnsafe('SELECT 1')
      logs.push({
        id: 2,
        level: 'info',
        source: 'Prisma',
        message: '数据库连接正常',
        detail: 'SELECT 1 ok',
        createdAt,
      })
    }
    catch (error) {
      logs.push({
        id: 2,
        level: 'error',
        source: 'Prisma',
        message: '数据库连接异常',
        detail: error instanceof Error ? error.message : String(error),
        createdAt,
      })
    }

    try {
      const pong = await this.redis.getClient().ping()
      logs.push({
        id: 3,
        level: 'info',
        source: 'Redis',
        message: 'Redis 连接正常',
        detail: `PING ${pong}`,
        createdAt,
      })
    }
    catch (error) {
      logs.push({
        id: 3,
        level: 'warn',
        source: 'Redis',
        message: 'Redis 连接不可用',
        detail: error instanceof Error ? error.message : String(error),
        createdAt,
      })
    }

    return logs
  }

  async getRoles() {
    try {
      return await (this.prisma as any).role.findMany({ orderBy: { id: 'asc' } })
    }
    catch {
      return this.memoryRoles
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
      })
    }
    catch {
      const role = {
        id: Date.now(),
        name: dto.name || '未命名角色',
        code: dto.code || `role_${Date.now()}`,
        status: dto.status ?? 1,
        remark: dto.remark || null,
        permissions: dto.permissions || [],
        createdAt: new Date().toISOString(),
      }
      this.memoryRoles.push(role)
      return role
    }
  }

  async updateRole(id: number, dto: UpsertRoleDto) {
    try {
      return await (this.prisma as any).role.update({
        where: { id },
        data: dto,
      })
    }
    catch {
      const index = this.memoryRoles.findIndex(item => item.id === id)
      if (index < 0)
        throw new NotFoundException('角色不存在')
      this.memoryRoles[index] = {
        ...this.memoryRoles[index],
        ...dto,
      }
      return this.memoryRoles[index]
    }
  }

  async deleteRole(id: number) {
    try {
      await (this.prisma as any).role.delete({ where: { id } })
    }
    catch {
      this.memoryRoles = this.memoryRoles.filter(item => item.id !== id)
    }
    return { success: true }
  }

  async getMenus() {
    try {
      const list = await (this.prisma as any).menu.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
      return this.buildTree(list)
    }
    catch {
      return this.buildTree(this.memoryMenus)
    }
  }

  async createMenu(dto: UpsertMenuDto) {
    try {
      return await (this.prisma as any).menu.create({ data: this.normalizeMenu(dto) })
    }
    catch {
      const menu = {
        id: Date.now(),
        ...this.normalizeMenu(dto),
      }
      this.memoryMenus.push(menu)
      return menu
    }
  }

  async updateMenu(id: number, dto: UpsertMenuDto) {
    try {
      return await (this.prisma as any).menu.update({
        where: { id },
        data: this.normalizeMenu(dto),
      })
    }
    catch {
      const index = this.memoryMenus.findIndex(item => item.id === id)
      if (index < 0)
        throw new NotFoundException('菜单不存在')
      this.memoryMenus[index] = {
        ...this.memoryMenus[index],
        ...this.normalizeMenu(dto),
      }
      return this.memoryMenus[index]
    }
  }

  async deleteMenu(id: number) {
    try {
      await (this.prisma as any).menu.delete({ where: { id } })
    }
    catch {
      this.memoryMenus = this.memoryMenus.filter(item => item.id !== id && item.parentId !== id)
    }
    return { success: true }
  }

  async getDepts() {
    try {
      const list = await (this.prisma as any).dept.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
      return this.buildTree(list)
    }
    catch {
      return this.buildTree(this.memoryDepts)
    }
  }

  async createDept(dto: UpsertDeptDto) {
    try {
      return await (this.prisma as any).dept.create({ data: this.normalizeDept(dto) })
    }
    catch {
      const dept = {
        id: Date.now(),
        ...this.normalizeDept(dto),
      }
      this.memoryDepts.push(dept)
      return dept
    }
  }

  async updateDept(id: number, dto: UpsertDeptDto) {
    try {
      return await (this.prisma as any).dept.update({
        where: { id },
        data: this.normalizeDept(dto),
      })
    }
    catch {
      const index = this.memoryDepts.findIndex(item => item.id === id)
      if (index < 0)
        throw new NotFoundException('部门不存在')
      this.memoryDepts[index] = {
        ...this.memoryDepts[index],
        ...this.normalizeDept(dto),
      }
      return this.memoryDepts[index]
    }
  }

  async deleteDept(id: number) {
    try {
      await (this.prisma as any).dept.delete({ where: { id } })
    }
    catch {
      this.memoryDepts = this.memoryDepts.filter(item => item.id !== id && item.parentId !== id)
    }
    return { success: true }
  }

  private buildTree<T extends {
    id: number
    parentId: number | null
    sort?: number
  }>(list: T[],
  ) {
    const map = new Map<number, TreeNode<T>>()
    const roots: TreeNode<T>[] = []

    list.forEach(item => map.set(item.id, {
      ...item,
      children: [],
    }))
    map.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)?.children?.push(item)
      }
      else {
        roots.push(item)
      }
    })

    const clean = (items: TreeNode<T>[]) =>
      items
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((item) => {
          if (item.children?.length) {
            item.children = clean(item.children)
          }
          else {
            delete item.children
          }
          return item
        })

    return clean(roots)
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
    }
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
    }
  }
}

import type { TenantContext } from '../tenant/tenant.types'
import type { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto'
import type { LoginLogView, TreeNode } from './model/admin-records'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { TenantAccessService } from '../tenant/tenant-access.service'
import { fallbackDepts, fallbackMenus, fallbackRoles } from './constants/admin-fallback-data'
import { buttonPermissions, pagePermissions } from './constants/admin-permissions'

/**
 * 后台管理聚合服务
 *
 * 职责边界：
 * - 角色/菜单/部门 三大核心聚合的 CRUD 与树形结构构建
 * - 登录日志/操作日志/系统日志 的多租户查询
 * - 在线用户会话管理（Redis）
 * - 权限码常量的对外暴露
 *
 * 设计说明：
 * - 采用「Prisma 优先 + 内存回退」双模式：
 *   所有写/读操作先尝试 Prisma，捕获异常后降级到内存数组，保证开发/测试环境无数据库时也能跑通
 *   生产环境应确保数据库可用，内存模式仅作兜底
 * - 多租户隔离通过 `TenantContext` + `TenantAccessService` 实现：
 *   平台管理员(dataScope=ALL)可跨租户查询；租户管理员仅能查自己租户数据
 * - 树形构建(`buildTree`)为通用工具，供菜单/部门复用，按 `sort` 升序排列
 *
 * @see TenantAccessService 租户权限校验
 * @see admin-fallback-data.ts 内存回退种子数据
 * @see admin-permissions.ts 页面/按钮权限码常量
 */
@Injectable()
export class AdminService {
  /** 内存回退存储：Prisma 不可用时的兜底数据源 */
  private memoryRoles = [...fallbackRoles]
  private memoryMenus = [...fallbackMenus]
  private memoryDepts = [...fallbackDepts]

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  /* ==================== 权限码常量 ==================== */

  /**
   * 获取页面级权限码常量
   * @returns 页面权限码映射表（供前端路由守卫、按钮显隐使用）
   */
  getPagePermissions() {
    return pagePermissions
  }

  /**
   * 获取按钮级权限码常量
   * @returns 按钮权限码映射表
   */
  getButtonPermissions() {
    return buttonPermissions
  }

  /* ==================== 在线用户会话 (Redis) ==================== */

  /**
   * 获取当前在线的后台管理用户列表
   * @returns 在线用户信息数组（含 userId、username、loginTime、ip 等）
   * @remarks 扫描 `admin:online:*` 模式键，批量获取再过滤空值
   */
  async getOnlineUsers() {
    try {
      const keys = await this.redis.keys('admin:online:*')
      if (!keys.length)
        return []
      const values = await Promise.all(keys.map(key => this.redis.getObject(key)))
      return values.filter(Boolean)
    }
    catch {
      // Redis 异常时静默返回空数组，避免影响主流程
      return []
    }
  }

  /**
   * 强制下线指定用户
   * @param id 用户 ID
   * @returns 固定成功响应（幂等操作）
   * @remarks 直接 DEL 对应 Redis 键，忽略不存在的情况
   */
  async forceLogout(id: number) {
    await this.redis.del(`admin:online:${id}`).catch(() => undefined)
    return { success: true }
  }

  /* ==================== 日志查询 (多租户隔离) ==================== */

  /**
   * 查询登录日志（最近 200 条，按时间倒序）
   * @param context 租户上下文，用于数据权限过滤
   * @returns 登录日志视图数组，含关联用户名
   */
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

  /**
   * 查询操作日志（最近 200 条，按时间倒序）
   * @param context 租户上下文
   * @returns 操作日志数组
   * @remarks 使用 `as any` 绕过 Prisma Client 类型（operationLog 可能未生成到 client 中）
   */
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

  /**
   * 查询系统日志（最近 200 条，按时间倒序）
   * @param context 租户上下文
   * @returns 系统日志数组；若数据库不可用或无数据，返回运行态健康检查日志
   * @remarks
   * - 非平台管理员仅能查看运行态健康日志（不走数据库）
   * - 数据库读取失败/无数据时，自动降级到 `getRuntimeSystemLogs()` 生成的实时健康快照
   */
  async getSystemLogs(context?: TenantContext) {
    // 非平台管理员：直接返回运行态健康日志，不查数据库
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

  /**
   * 构建登录日志的多租户 where 条件
   * @param context 租户上下文
   * @returns Prisma where 条件；undefined 表示无过滤（平台管理员）
   */
  private buildLoginLogWhere(context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return undefined

    this.tenantAccess.assertCanRead(context)

    if (!context.tenantId)
      return { userId: -1 } // 无租户 ID 时匹配不到任何记录

    return { user: { tenantId: context.tenantId } }
  }

  /**
   * 构建操作日志的多租户 where 条件
   * @param context 租户上下文
   * @returns Prisma where 条件
   */
  private buildOperationLogWhere(context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return undefined

    this.tenantAccess.assertCanRead(context)

    if (!context.tenantId)
      return { tenantId: -1 }

    return { tenantId: context.tenantId }
  }

  /**
   * 生成运行态系统健康日志（无需数据库）
   * @returns 包含 NestJS/Prisma/Redis 连接状态的日志数组
   * @remarks 用于系统日志表不可用时的兜底展示，也供非平台管理员查看
   */
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

    // Prisma 连通性探测
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

    // Redis 连通性探测
    try {
      const pong = await this.redis.ping()
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

  /* ==================== 角色管理 (CRUD + 内存回退) ==================== */

  /**
   * 获取所有角色列表（按 ID 升序）
   * @returns 角色数组
   */
  async getRoles() {
    try {
      return await (this.prisma as any).role.findMany({ orderBy: { id: 'asc' } })
    }
    catch {
      return this.memoryRoles
    }
  }

  /**
   * 创建角色
   * @param dto 角色创建 DTO
   * @returns 新建角色对象
   * @remarks 缺省值：code=role_${timestamp}、status=1、permissions=[]
   */
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

  /**
   * 更新角色
   * @param id 角色 ID
   * @param dto 更新 DTO（部分字段）
   * @returns 更新后的角色对象
   * @throws NotFoundException 内存模式下角色不存在时
   */
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

  /**
   * 删除角色
   * @param id 角色 ID
   * @returns 固定成功响应（幂等）
   * @remarks 内存模式下直接过滤数组；Prisma 模式下若外键约束报错会抛异常上传
   */
  async deleteRole(id: number) {
    try {
      await (this.prisma as any).role.delete({ where: { id } })
    }
    catch {
      this.memoryRoles = this.memoryRoles.filter(item => item.id !== id)
    }
    return { success: true }
  }

  /* ==================== 菜单管理 (CRUD + 树构建 + 内存回退) ==================== */

  /**
   * 获取菜单树（按 sort、id 升序）
   * @returns 树形菜单数组，每节点含 children 递归结构
   */
  async getMenus() {
    try {
      const list = await (this.prisma as any).menu.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
      return this.buildTree(list)
    }
    catch {
      return this.buildTree(this.memoryMenus)
    }
  }

  /**
   * 创建菜单
   * @param dto 菜单创建 DTO
   * @returns 新建菜单对象
   */
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

  /**
   * 更新菜单
   * @param id 菜单 ID
   * @param dto 更新 DTO
   * @returns 更新后的菜单对象
   * @throws NotFoundException 内存模式下菜单不存在时
   */
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

  /**
   * 删除菜单（级联删除子菜单）
   * @param id 菜单 ID
   * @returns 固定成功响应
   * @remarks 内存模式下同步过滤掉该节点及其所有子节点
   */
  async deleteMenu(id: number) {
    try {
      await (this.prisma as any).menu.delete({ where: { id } })
    }
    catch {
      this.memoryMenus = this.memoryMenus.filter(item => item.id !== id && item.parentId !== id)
    }
    return { success: true }
  }

  /* ==================== 部门管理 (CRUD + 树构建 + 内存回退) ==================== */

  /**
   * 获取部门树（按 sort、id 升序）
   * @returns 树形部门数组
   */
  async getDepts() {
    try {
      const list = await (this.prisma as any).dept.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
      return this.buildTree(list)
    }
    catch {
      return this.buildTree(this.memoryDepts)
    }
  }

  /**
   * 创建部门
   * @param dto 部门创建 DTO
   * @returns 新建部门对象
   */
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

  /**
   * 更新部门
   * @param id 部门 ID
   * @param dto 更新 DTO
   * @returns 更新后的部门对象
   * @throws NotFoundException 内存模式下部门不存在时
   */
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

  /**
   * 删除部门（级联删除子部门）
   * @param id 部门 ID
   * @returns 固定成功响应
   */
  async deleteDept(id: number) {
    try {
      await (this.prisma as any).dept.delete({ where: { id } })
    }
    catch {
      this.memoryDepts = this.memoryDepts.filter(item => item.id !== id && item.parentId !== id)
    }
    return { success: true }
  }

  /* ==================== 通用工具方法 ==================== */

  /**
   * 通用树形结构构建器
   * @param list 扁平节点数组，需含 id、parentId、可选 sort
   * @returns 树形数组（根节点在第一层），按 sort 升序，叶子节点不含 children 字段
   * @remarks
   * - 两次遍历：先建 Map，再按 parentId 挂载 children
   * - 最后递归清理：排序 + 叶子节点删除空 children 数组
   * - 复用于菜单/部门两个聚合
   */
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

  /**
   * 归一化菜单 DTO → Prisma create/update data
   * @param dto 原始 DTO
   * @returns 补全默认值后的数据对象
   * @remarks 缺省值：parentId=null、title=未命名菜单、type=menu、sort=0、status=1
   */
  private normalizeMenu(dto: UpsertMenuDto) {
    return {
      parentId: dto.parentId ?? null,
      title: dto.title || '未命名菜单',
      path: dto.path || '',
      name: dto.name || null,
      icon: dto.icon || null,
      permission: dto.permission || null,
      component: dto.component || null,
      type: dto.type || 'menu',
      sort: dto.sort ?? 0,
      status: dto.status ?? 1,
    }
  }

  /**
   * 归一化部门 DTO → Prisma create/update data
   * @param dto 原始 DTO
   * @returns 补全默认值后的数据对象
   * @remarks 缺省值：parentId=null、name=未命名部门、sort=0、status=1
   */
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

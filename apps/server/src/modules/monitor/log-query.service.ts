import type { TenantContext } from '../tenant/tenant.types'
import type { LoginLogView } from './monitor.types'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { TenantAccessService } from '../tenant/tenant-access.service'

/**
 * 日志读取与运行态健康快照独立于系统 CRUD。
 * 租户过滤和数据库不可用时的回退一并迁移，避免拆文件后扩大数据可见范围。
 */
@Injectable()
export class LogQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

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
}

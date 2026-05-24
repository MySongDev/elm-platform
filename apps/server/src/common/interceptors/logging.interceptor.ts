import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import type { PrismaService } from '../../prisma/prisma.service'
import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'

interface HttpRequestLike {
  method?: string
  url?: string
  originalUrl?: string
  path?: string
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  params?: Record<string, unknown>
  headers?: Record<string, string | string[] | undefined>
  ip?: string
  user?: { username?: string }
}

interface HttpResponseLike {
  statusCode?: number
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  constructor(private readonly prisma?: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp()
    const request = http.getRequest<HttpRequestLike>()
    const response = http.getResponse<HttpResponseLike>()
    const method = request.method ?? 'UNKNOWN'
    const url = this.resolvePath(request)
    const now = Date.now()

    this.logger.log(`[${method}] ${url}`)
    this.debugPayload('Body', request.body)
    this.debugPayload('Query', request.query)
    this.debugPayload('Params', request.params)

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now
        const status = response.statusCode ?? 200
        this.logger.log(`[${method}] ${url} - ${duration}ms`)
        void this.recordOperationLog(request, status, duration)
      }),
      catchError((error) => {
        const duration = Date.now() - now
        const status = this.resolveErrorStatus(error, response)
        this.logger.error(`[${method}] ${url} - ${duration}ms`, error?.stack)
        void this.recordOperationLog(request, status, duration)
        void this.recordSystemLog(request, error, status, duration)
        return throwError(() => error)
      }),
    )
  }

  private debugPayload(label: string, payload?: Record<string, unknown>) {
    if (payload && Object.keys(payload).length) {
      this.logger.debug(`${label}: ${JSON.stringify(payload)}`)
    }
  }

  private async recordOperationLog(request: HttpRequestLike, status: number, duration: number) {
    if (!this.prisma || !(this.prisma as any).operationLog?.create)
      return

    const method = request.method ?? 'UNKNOWN'
    const path = this.resolvePath(request)
    const { module, action } = this.resolveOperationMeta(method, path)

    try {
      await (this.prisma as any).operationLog.create({
        data: {
          username: this.resolveUsername(request),
          module,
          action,
          method,
          path,
          ip: this.resolveIp(request),
          status,
          duration: Math.max(0, duration),
        },
      })
    }
    catch {
      // 操作日志不能影响业务请求。
    }
  }

  private async recordSystemLog(
    request: HttpRequestLike,
    error: any,
    status: number,
    duration: number,
  ) {
    if (!this.prisma || !(this.prisma as any).systemLog?.create)
      return

    try {
      const method = request.method ?? 'UNKNOWN'
      const path = this.resolvePath(request)
      await (this.prisma as any).systemLog.create({
        data: {
          level: status >= 500 ? 'error' : 'warn',
          source: `${method} ${path}`,
          message: error?.message || `HTTP ${status}`,
          detail: error?.stack || `status=${status}, duration=${Math.max(0, duration)}ms`,
        },
      })
    }
    catch {
      // 系统日志不能影响业务请求。
    }
  }

  private resolvePath(request: HttpRequestLike): string {
    return request.originalUrl || request.url || request.path || '-'
  }

  private resolveUsername(request: HttpRequestLike): string {
    const bodyAccount = request.body?.account ?? request.body?.username
    return request.user?.username || (typeof bodyAccount === 'string' ? bodyAccount : 'anonymous')
  }

  private resolveIp(request: HttpRequestLike): string | null {
    const forwardedFor = request.headers?.['x-forwarded-for']
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
    return forwardedIp?.split(',')[0]?.trim() || request.ip || null
  }

  private resolveErrorStatus(error: any, response: HttpResponseLike): number {
    return error?.status || error?.response?.statusCode || response.statusCode || 500
  }

  private resolveOperationMeta(method: string, path: string) {
    const normalizedPath = path.replace(/^\/api/, '')

    if (normalizedPath.includes('/auth/login'))
      return { module: '认证管理', action: '用户登录' }
    if (normalizedPath.includes('/auth/logout'))
      return { module: '认证管理', action: '退出登录' }
    if (normalizedPath.includes('/admin/monitor/online-users') && method === 'POST')
      return { module: '系统监控', action: '强制用户下线' }
    if (normalizedPath.includes('/admin/monitor'))
      return { module: '系统监控', action: '查看监控数据' }
    if (normalizedPath.includes('/admin/system/roles'))
      return { module: '系统管理', action: this.resolveCrudAction(method, '角色') }
    if (normalizedPath.includes('/admin/system/menus'))
      return { module: '系统管理', action: this.resolveCrudAction(method, '菜单') }
    if (normalizedPath.includes('/admin/system/depts'))
      return { module: '系统管理', action: this.resolveCrudAction(method, '部门') }
    if (normalizedPath.includes('/users'))
      return { module: '用户管理', action: this.resolveCrudAction(method, '用户') }
    if (normalizedPath.includes('/admin/commerce/restaurants'))
      return { module: '业务管理', action: this.resolveCrudAction(method, '商家') }
    if (normalizedPath.includes('/admin/commerce/foods'))
      return { module: '业务管理', action: this.resolveCrudAction(method, '商品') }
    if (normalizedPath.includes('/admin/commerce/orders'))
      return { module: '业务管理', action: this.resolveCrudAction(method, '订单') }

    return { module: '后台管理', action: this.resolveMethodAction(method) }
  }

  private resolveCrudAction(method: string, subject: string): string {
    const actionByMethod: Record<string, string> = {
      GET: `查询${subject}`,
      POST: `新增${subject}`,
      PUT: `更新${subject}`,
      PATCH: `更新${subject}`,
      DELETE: `删除${subject}`,
    }

    return actionByMethod[method] ?? this.resolveMethodAction(method)
  }

  private resolveMethodAction(method: string): string {
    const actionByMethod: Record<string, string> = {
      GET: '查询数据',
      POST: '提交数据',
      PUT: '更新数据',
      PATCH: '更新数据',
      DELETE: '删除数据',
    }

    return actionByMethod[method] ?? method
  }
}

import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { firstValueFrom, of, throwError } from 'rxjs'
import { LoggingInterceptor } from './logging.interceptor'

describe('loggingInterceptor', () => {
  function createContext(overrides: Record<string, unknown> = {}): ExecutionContext {
    const request = {
      method: 'PATCH',
      url: '/api/admin/system/roles/1',
      path: '/api/admin/system/roles/1',
      ip: '127.0.0.1',
      body: {},
      query: {},
      params: { id: '1' },
      user: { username: 'admin' },
      ...overrides,
    }
    const response = { statusCode: 200 }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext
  }

  function createHandler<T>(value: T): CallHandler<T> {
    return {
      handle: () => of(value),
    }
  }

  it('records successful HTTP operations into operation_logs', async () => {
    const create = jest.fn().mockResolvedValue({ id: 1 })
    const interceptor = new LoggingInterceptor({ operationLog: { create } } as any)

    await firstValueFrom(interceptor.intercept(createContext(), createHandler({ ok: true })))
    await Promise.resolve()

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: 'admin',
        module: '系统管理',
        action: '更新角色',
        method: 'PATCH',
        path: '/api/admin/system/roles/1',
        ip: '127.0.0.1',
        status: 200,
      }),
    })
    expect(create.mock.calls[0][0].data.duration).toEqual(expect.any(Number))
  })

  it('records failed HTTP requests into system_logs', async () => {
    const createOperationLog = jest.fn().mockResolvedValue({ id: 1 })
    const createSystemLog = jest.fn().mockResolvedValue({ id: 2 })
    const interceptor = new LoggingInterceptor({
      operationLog: { create: createOperationLog },
      systemLog: { create: createSystemLog },
    } as any)
    const error = new Error('database exploded') as Error & { status?: number }
    error.status = 500

    await expect(firstValueFrom(
      interceptor.intercept(
        createContext({ method: 'GET', url: '/api/admin/monitor/system-logs' }),
        { handle: () => throwError(() => error) } as any,
      ),
    )).rejects.toThrow('database exploded')
    await Promise.resolve()

    expect(createSystemLog).toHaveBeenCalledWith({
      data: expect.objectContaining({
        level: 'error',
        source: 'GET /api/admin/monitor/system-logs',
        message: 'database exploded',
      }),
    })
  })
})

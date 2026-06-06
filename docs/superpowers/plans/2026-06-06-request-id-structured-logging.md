# Phase 2B-1 RequestId Structured Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend requestId propagation and include requestId in HTTP logs and system log details.

**Architecture:** Add a focused middleware that owns requestId extraction/generation/response header propagation. Keep `LoggingInterceptor` as the logging/audit boundary, enhanced only to read requestId and include it in log strings plus `systemLog.detail`. No database schema, frontend, OpenTelemetry, Sentry, pino, or winston changes.

**Tech Stack:** NestJS middleware, Node `crypto.randomUUID`, existing Nest `Logger`, Jest unit tests.

---

## File Structure

- `apps/server/src/common/middleware/request-id.middleware.ts` — requestId middleware and lightweight request/response interfaces.
- `apps/server/src/common/middleware/request-id.middleware.spec.ts` — unit tests for header reuse, UUID generation, and response header propagation.
- `apps/server/src/main.ts` — registers the middleware before filters/interceptors.
- `apps/server/src/common/interceptors/logging.interceptor.ts` — reads requestId and includes it in logs and system log detail.
- `apps/server/src/common/interceptors/logging.interceptor.spec.ts` — verifies requestId is preserved in system log detail and log output.

---

### Task 1: Add requestId middleware tests

**Files:**
- Create: `apps/server/src/common/middleware/request-id.middleware.spec.ts`

- [ ] **Step 1: Write failing middleware tests**

Create `apps/server/src/common/middleware/request-id.middleware.spec.ts`:

```ts
import { requestIdMiddleware } from './request-id.middleware'

describe('requestIdMiddleware', () => {
  function createResponse() {
    return {
      setHeader: jest.fn(),
    }
  }

  it('reuses incoming x-request-id header', () => {
    const request = {
      headers: {
        'x-request-id': 'client-request-123',
      },
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toBe('client-request-123')
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'client-request-123')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('uses the first x-request-id header value when header is an array', () => {
    const request = {
      headers: {
        'x-request-id': ['first-request-id', 'second-request-id'],
      },
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toBe('first-request-id')
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'first-request-id')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('generates a UUID requestId when header is missing', () => {
    const request = {
      headers: {},
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toEqual(expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ))
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', request.requestId)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('generates a UUID requestId when header is blank', () => {
    const request = {
      headers: {
        'x-request-id': '   ',
      },
    }
    const response = createResponse()
    const next = jest.fn()

    requestIdMiddleware(request, response, next)

    expect(request.requestId).toEqual(expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ))
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', request.requestId)
    expect(next).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run middleware test to verify it fails**

Run:

```bash
pnpm --filter vue3-elm-node run test -- request-id.middleware.spec.ts
```

Expected: FAIL because `./request-id.middleware` does not exist.

---

### Task 2: Implement requestId middleware

**Files:**
- Create: `apps/server/src/common/middleware/request-id.middleware.ts`
- Test: `apps/server/src/common/middleware/request-id.middleware.spec.ts`

- [ ] **Step 1: Implement middleware**

Create `apps/server/src/common/middleware/request-id.middleware.ts`:

```ts
import { randomUUID } from 'node:crypto'

export interface RequestIdRequestLike {
  headers?: Record<string, string | string[] | undefined>
  requestId?: string
}

export interface RequestIdResponseLike {
  setHeader?: (name: string, value: string) => void
}

export type RequestIdNext = () => void

export function requestIdMiddleware(
  request: RequestIdRequestLike,
  response: RequestIdResponseLike,
  next: RequestIdNext,
) {
  const requestId = resolveRequestId(request.headers?.['x-request-id'])

  request.requestId = requestId
  response.setHeader?.('x-request-id', requestId)

  next()
}

function resolveRequestId(value: string | string[] | undefined): string {
  const headerValue = Array.isArray(value) ? value[0] : value
  const normalized = headerValue?.trim()

  return normalized || randomUUID()
}
```

- [ ] **Step 2: Run middleware test**

Run:

```bash
pnpm --filter vue3-elm-node run test -- request-id.middleware.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Commit middleware**

```bash
git add apps/server/src/common/middleware/request-id.middleware.ts apps/server/src/common/middleware/request-id.middleware.spec.ts
git commit -m "feat(server): add request id middleware"
```

---

### Task 3: Register middleware in bootstrap

**Files:**
- Modify: `apps/server/src/main.ts`

- [ ] **Step 1: Import middleware**

In `apps/server/src/main.ts`, add:

```ts
import { requestIdMiddleware } from './common/middleware/request-id.middleware'
```

Expected top imports include:

```ts
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { requestIdMiddleware } from './common/middleware/request-id.middleware'
import { PrismaService } from './prisma/prisma.service'
```

- [ ] **Step 2: Register middleware after app creation**

After:

```ts
const app = await NestFactory.create(AppModule)
const configService = app.get(ConfigService)
```

Add:

```ts
app.use(requestIdMiddleware)
```

Expected section:

```ts
const app = await NestFactory.create(AppModule)
const configService = app.get(ConfigService)

app.use(requestIdMiddleware)

// 全局前缀
const prefix = configService.get<string>('APP_PREFIX', 'api')
```

- [ ] **Step 3: Run server build**

Run:

```bash
pnpm --filter vue3-elm-node run build
```

Expected: PASS.

- [ ] **Step 4: Commit bootstrap registration**

```bash
git add apps/server/src/main.ts
git commit -m "feat(server): register request id middleware"
```

---

### Task 4: Add LoggingInterceptor requestId tests

**Files:**
- Modify: `apps/server/src/common/interceptors/logging.interceptor.spec.ts`

- [ ] **Step 1: Extend test request fixture with requestId support**

In `createContext`, keep the `overrides` spread so tests can pass `requestId`. No code change may be necessary because existing helper already spreads `overrides` into request.

- [ ] **Step 2: Add test for systemLog detail requestId**

Append this test inside `describe('loggingInterceptor', () => { ... })`:

```ts
  it('includes requestId in failed request system log detail', async () => {
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
        createContext({
          method: 'GET',
          url: '/api/admin/monitor/system-logs',
          requestId: 'req-test-001',
        }),
        { handle: () => throwError(() => error) } as any,
      ),
    )).rejects.toThrow('database exploded')
    await Promise.resolve()

    expect(createSystemLog).toHaveBeenCalledWith({
      data: expect.objectContaining({
        detail: expect.stringContaining('requestId=req-test-001'),
      }),
    })
  })
```

- [ ] **Step 3: Add test for log output requestId**

At the top of the file, update import:

```ts
import { Logger } from '@nestjs/common'
```

Then add this test inside the same describe block:

```ts
  it('includes requestId in success log output', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
    const create = jest.fn().mockResolvedValue({ id: 1 })
    const interceptor = new LoggingInterceptor({ operationLog: { create } } as any)

    try {
      await firstValueFrom(interceptor.intercept(
        createContext({ requestId: 'req-log-001' }),
        createHandler({ ok: true }),
      ))
      await Promise.resolve()

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('requestId=req-log-001'))
    }
    finally {
      logSpy.mockRestore()
    }
  })
```

- [ ] **Step 4: Run logging test to verify failure**

Run:

```bash
pnpm --filter vue3-elm-node run test -- logging.interceptor.spec.ts
```

Expected: FAIL because interceptor does not include requestId yet.

---

### Task 5: Enhance LoggingInterceptor with requestId

**Files:**
- Modify: `apps/server/src/common/interceptors/logging.interceptor.ts`
- Test: `apps/server/src/common/interceptors/logging.interceptor.spec.ts`

- [ ] **Step 1: Add requestId to request interface**

In `HttpRequestLike`, add:

```ts
requestId?: string
```

Expected interface includes:

```ts
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
  requestId?: string
  user?: { username?: string }
}
```

- [ ] **Step 2: Resolve requestId in intercept**

After resolving `url`, add:

```ts
const requestId = this.resolveRequestId(request)
```

Replace log messages:

```ts
this.logger.log(`[requestId=${requestId}] [${method}] ${url}`)
```

```ts
this.logger.log(`[requestId=${requestId}] [${method}] ${url} - ${duration}ms`)
```

```ts
this.logger.error(`[requestId=${requestId}] [${method}] ${url} - ${duration}ms`, error?.stack)
```

- [ ] **Step 3: Add systemLog detail requestId**

In `recordSystemLog`, before creating the log, add:

```ts
const requestId = this.resolveRequestId(request)
```

Replace `detail` with:

```ts
const fallbackDetail = `requestId=${requestId}, status=${status}, duration=${Math.max(0, duration)}ms`
const detail = error?.stack
  ? `requestId=${requestId}, status=${status}, duration=${Math.max(0, duration)}ms\n${error.stack}`
  : fallbackDetail
```

Then in `data`, use:

```ts
detail,
```

Expected block:

```ts
const method = request.method ?? 'UNKNOWN'
const path = this.resolvePath(request)
const requestId = this.resolveRequestId(request)
const fallbackDetail = `requestId=${requestId}, status=${status}, duration=${Math.max(0, duration)}ms`
const detail = error?.stack
  ? `requestId=${requestId}, status=${status}, duration=${Math.max(0, duration)}ms\n${error.stack}`
  : fallbackDetail
await (this.prisma as any).systemLog.create({
  data: {
    level: status >= 500 ? 'error' : 'warn',
    source: `${method} ${path}`,
    message: error?.message || `HTTP ${status}`,
    detail,
  },
})
```

- [ ] **Step 4: Add requestId helpers**

Add these private methods near `resolvePath`:

```ts
  private resolveRequestId(request: HttpRequestLike): string {
    return request.requestId || this.resolveHeaderValue(request.headers?.['x-request-id']) || '-'
  }

  private resolveHeaderValue(value: string | string[] | undefined): string | undefined {
    const headerValue = Array.isArray(value) ? value[0] : value
    const normalized = headerValue?.trim()

    return normalized || undefined
  }
```

- [ ] **Step 5: Run logging test**

Run:

```bash
pnpm --filter vue3-elm-node run test -- logging.interceptor.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit interceptor enhancement**

```bash
git add apps/server/src/common/interceptors/logging.interceptor.ts apps/server/src/common/interceptors/logging.interceptor.spec.ts
git commit -m "feat(server): include request id in logging interceptor"
```

---

### Task 6: Final verification

**Files:**
- No new code files beyond previous tasks.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter vue3-elm-node run test -- request-id.middleware.spec.ts
pnpm --filter vue3-elm-node run test -- logging.interceptor.spec.ts
```

Expected: both PASS.

- [ ] **Step 2: Run full server test suite**

Run:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/elm_test?schema=public' pnpm --filter vue3-elm-node run test
```

PowerShell:

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/elm_test?schema=public'; pnpm --filter vue3-elm-node run test
```

Expected: PASS.

- [ ] **Step 3: Run server build**

Run:

```bash
pnpm --filter vue3-elm-node run build
```

Expected: PASS.

- [ ] **Step 4: Run lint**

Run:

```bash
pnpm lint
```

Expected: 0 errors. Existing warnings may remain.

- [ ] **Step 5: Push branch**

Run:

```bash
git push
```

Expected: pre-push hook runs `pnpm type-check`; push succeeds.

---

## Self-Review

Spec coverage:
- Middleware generation/reuse/response header: Tasks 1-3.
- LoggingInterceptor log strings and systemLog detail: Tasks 4-5.
- No DB schema/frontend/OpenTelemetry/Sentry/pino changes: no tasks touch those areas.

Placeholder scan:
- No TBD/TODO placeholders remain.
- Code snippets include exact file contents or exact replacement snippets.

Type consistency:
- `requestId` property is consistently used on `HttpRequestLike` and `RequestIdRequestLike`.
- Header name is consistently lowercase `x-request-id`, matching Node/Express normalized headers.

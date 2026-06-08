# Phase 2B-1: requestId 与结构化日志设计

## Context

Phase 2A 已完成低风险质量门禁：pre-push type-check、coverage scripts、CI coverage job、非阻塞 security audit。下一步进入基础可观测性：让每�?HTTP 请求都有可追踪的 `requestId`，并让后端日�?审计记录带上�?ID，方便多人协作和线上排障�?
当前后端已有�?
- `LoggingInterceptor`：记录请求、错误、operationLog、systemLog�?- `AllExceptionsFilter`：统一异常处理�?- `TransformInterceptor`：统一响应格式�?- `HealthModule`：DB + Redis health check�?
当前缺口�?
- 请求日志没有统一 requestId�?- 响应头没有返�?`x-request-id`�?- operationLog/systemLog 无法关联同一次请求�?- 日志仍以字符串为主，排查时不便于 grep/聚合�?
## Goals

- 每个 HTTP 请求都有一�?`requestId`�?- 支持外部透传 `x-request-id`，没有则后端生成�?- 响应头写�?`x-request-id`�?- `LoggingInterceptor` 的普通日志、错误日志、operationLog、systemLog 都包�?requestId�?- 保持低风险：不引�?OpenTelemetry、不改前端、不改数据库 schema�?
## Non-goals

- 不接�?OpenTelemetry/Jaeger/Tempo�?- 不接�?Sentry�?- 不新增数据库字段�?- 不要求前端主动生�?requestId�?- 不重写整个日志系统�?
## Design

### 1. Request ID middleware

新增 `apps/server/src/common/middleware/request-id.middleware.ts`�?
职责�?
1. 从请求头读取 `x-request-id`�?2. 如果 header 存在且非空，则复用它�?3. 如果不存在，则使�?`crypto.randomUUID()` 生成�?4. �?requestId 写入�?   - `request.requestId`
   - response header `x-request-id`

为了避免引入 Express 类型耦合，定义轻量接口：

```ts
interface RequestIdRequestLike {
  headers?: Record<string, string | string[] | undefined>
  requestId?: string
}

interface RequestIdResponseLike {
  setHeader?: (name: string, value: string) => void
}
```

### 2. main.ts 接入 middleware

�?`apps/server/src/main.ts` 中，创建 app 后、全局 interceptor/filter 前注册：

```ts
app.use(requestIdMiddleware)
```

原因：interceptor �?filter 执行时应已经能读�?`request.requestId`�?
### 3. LoggingInterceptor 增强

扩展 `HttpRequestLike`�?
```ts
requestId?: string
```

新增 helper�?
```ts
private resolveRequestId(request: HttpRequestLike): string {
  return request.requestId || this.resolveHeaderValue(request.headers?.['x-request-id']) || '-'
}
```

日志格式调整为仍使用 Nest Logger，但内容包含 requestId�?
```text
[requestId=xxx] [PATCH] /api/admin/system/roles/1 - 12ms
```

operationLog 当前 Prisma schema (`apps/server/prisma/schema.prisma`) 没有 `requestId` �?`detail` 字段，本轮不新增字段，避�?migration 风险。因�?operationLog 继续保持现有字段，只通过普通日志文本关�?requestId�?
systemLog 当前�?`detail` 字段，错误记录中增加�?
```text
requestId=xxx, status=500, duration=12ms
<stack>
```

### 4. 测试策略

新增/修改测试�?
1. `request-id.middleware.spec.ts`
   - �?`x-request-id` 时复�?header�?   - �?header 时生�?UUID 格式 requestId�?   - 写入 response header�?
2. `logging.interceptor.spec.ts`
   - 成功记录 operationLog 时，仍保留现有行为�?   - 失败记录 systemLog 时，`detail` 包含 requestId�?   - 日志字符串包�?requestId（可 spy `Logger.prototype.log/error`，如现有测试不适合则只�?systemLog detail）�?
## Files to Change

- Create: `apps/server/src/common/middleware/request-id.middleware.ts`
- Create: `apps/server/src/common/middleware/request-id.middleware.spec.ts`
- Modify: `apps/server/src/main.ts`
- Modify: `apps/server/src/common/interceptors/logging.interceptor.ts`
- Modify: `apps/server/src/common/interceptors/logging.interceptor.spec.ts`

## Verification

```bash
pnpm --filter @elm-platform/server run test -- request-id.middleware.spec.ts
pnpm --filter @elm-platform/server run test -- logging.interceptor.spec.ts
pnpm --filter @elm-platform/server run test
pnpm --filter @elm-platform/server run build
```

可选手动验证：

```bash
curl -i -H "x-request-id: local-test-123" http://localhost:3000/health
```

预期响应头包含：

```text
x-request-id: local-test-123
```

## Risks and Tradeoffs

- 不新增数据库字段意味着 operationLog 不能结构化保�?requestId；这是为了避�?migration 和业务模型风险。后�?Phase 2C 可通过 schema migration 增加 requestId 字段�?- 仍使�?Nest Logger 字符串日志，不引�?pino/winston，降低改动风险。后续可演进�?JSON logger�?- 不改前端 HTTP client，因此前端暂不会主动生成 requestId；浏览器请求仍会由后端生成并通过响应头返回�?
## Follow-up

后续可以继续�?
- 前端 HTTP client 自动生成/透传 `X-Request-Id`�?- Prisma operationLog/systemLog 增加 requestId 字段�?- 引入 JSON logger（pino/winston）�?- OpenTelemetry traceId �?requestId 对齐�?

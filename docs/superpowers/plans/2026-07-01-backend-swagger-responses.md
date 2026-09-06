# Backend Swagger Responses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为除 `apps/server/src/modules/elm/**` 外的全部后端接口补齐准确、可展开、带中文字段说明的 Swagger 成功与错误响应 Schema。

**Architecture:** 在 `common/swagger` 建立基于 `ApiExtraModels`、`getSchemaPath` 和 `allOf` 的统一响应装饰器，业务模块只维护与 Service 实际返回值一致的响应 DTO。普通接口描述全局 `{ code, message, data, timestamp }` 包装，支付模块的 `rawResponse()` 接口使用原始响应装饰器；元数据覆盖测试负责防止遗漏接口。

**Tech Stack:** NestJS 10、`@nestjs/swagger`、TypeScript、Jest、pnpm、OpenAPI 3。

---

## Scope Guard

- 不修改 `apps/server/src/modules/elm/**`。
- 不改变 Controller 或 Service 的运行时返回值。
- 不改变 `TransformInterceptor`、`AllExceptionsFilter` 的协议。
- 不把 Prisma 模型直接作为公开响应契约；DTO 仅描述实际返回字段。
- 不覆盖工作区已有改动，尤其是当前已修改的 `apps/server/src/modules/user/user.controller.ts`。
- 每次只暂存当前任务列出的文件，禁止使用 `git add .`。

## File Structure

- Create: `apps/server/src/common/swagger/api-response.dto.ts`
  - 成功 envelope 与统一错误响应的基础模型。
- Create: `apps/server/src/common/swagger/api-response.decorator.ts`
  - 单对象、数组、空业务值、原始响应及错误响应装饰器。
- Create: `apps/server/src/common/swagger/api-response.decorator.spec.ts`
  - 使用最小测试 Controller 生成 OpenAPI 文档，验证公共装饰器。
- Create: `apps/server/src/common/swagger/swagger-response-coverage.spec.ts`
  - 检查所有非 `elm` Controller 方法的响应元数据。
- Create: `apps/server/src/modules/auth/dto/auth-response.dto.ts`
- Modify: `apps/server/src/modules/auth/dto/login.dto.ts`
- Modify: `apps/server/src/modules/auth/auth.controller.ts`
- Create: `apps/server/src/modules/customer-auth/dto/customer-auth-response.dto.ts`
- Modify: `apps/server/src/modules/customer-auth/customer-auth.controller.ts`
- Create: `apps/server/src/modules/admin/dto/admin-response.dto.ts`
- Modify: `apps/server/src/modules/admin/admin.controller.ts`
- Create: `apps/server/src/modules/user/dto/user-response.dto.ts`
- Modify: `apps/server/src/modules/user/user.controller.ts`
- Create: `apps/server/src/modules/tenant/dto/tenant-response.dto.ts`
- Modify: `apps/server/src/modules/tenant/tenant.controller.ts`
- Create: `apps/server/src/modules/merchant-onboarding/dto/merchant-onboarding-response.dto.ts`
- Modify: `apps/server/src/modules/merchant-onboarding/merchant-onboarding.controller.ts`
- Create: `apps/server/src/modules/notification/dto/notification-response.dto.ts`
- Modify: `apps/server/src/modules/notification/notification.controller.ts`
- Create: `apps/server/src/modules/payment/dto/payment-response.dto.ts`
- Modify: `apps/server/src/modules/payment/dto/resume-alipay-wap-payment.dto.ts`
- Modify: `apps/server/src/modules/payment/payment.controller.ts`
- Create: `apps/server/src/health/dto/health-response.dto.ts`
- Modify: `apps/server/src/health/health.controller.ts`

## Task 1: Build and Test Common Swagger Response Decorators

**Files:**
- Create: `apps/server/src/common/swagger/api-response.decorator.spec.ts`
- Create: `apps/server/src/common/swagger/api-response.dto.ts`
- Create: `apps/server/src/common/swagger/api-response.decorator.ts`

- [ ] **Step 1: Write the failing decorator contract test**

Create a minimal fixture controller in `api-response.decorator.spec.ts`:

```ts
class FixtureDataDto {
  @ApiProperty({ description: '资源 ID', example: 1 })
  id: number
}

@Controller('swagger-fixture')
class SwaggerFixtureController {
  @Get('one')
  @ApiSuccessResponse(FixtureDataDto, { description: '获取单个资源' })
  one() {}

  @Get('many')
  @ApiArrayResponse(FixtureDataDto)
  many() {}

  @Post('created')
  @ApiSuccessResponse(FixtureDataDto, { status: 201 })
  created() {}

  @Delete('empty')
  @ApiEmptyResponse()
  empty() {}

  @Get('raw')
  @ApiRawResponse(FixtureDataDto)
  raw() {}

  @Get('error')
  @ApiErrorResponses(400, 401, 500)
  error() {}
}
```

Generate a document with `Test.createTestingModule`, `createNestApplication()` and `SwaggerModule.createDocument()`. Assert:

```ts
expect(one.schema.allOf[1].properties.data.$ref)
  .toBe('#/components/schemas/FixtureDataDto')
expect(many.schema.allOf[1].properties.data.items.$ref)
  .toBe('#/components/schemas/FixtureDataDto')
expect(document.paths['/swagger-fixture/created'].post.responses['201']).toBeDefined()
expect(document.paths['/swagger-fixture/empty'].delete.responses['200'].content['application/json'].schema.$ref)
  .toBe('#/components/schemas/ApiResponseEnvelopeDto')
expect(document.paths['/swagger-fixture/raw'].get.responses['200'].content['application/json'].schema.$ref)
  .toBe('#/components/schemas/FixtureDataDto')
expect(document.paths['/swagger-fixture/error'].get.responses['400']).toBeDefined()
expect(document.paths['/swagger-fixture/error'].get.responses['401']).toBeDefined()
expect(document.paths['/swagger-fixture/error'].get.responses['500']).toBeDefined()
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
pnpm --filter @elm-platform/server run test -- common/swagger/api-response.decorator.spec.ts
```

Expected: FAIL because the DTO and decorators do not exist.

- [ ] **Step 3: Implement the shared DTOs**

Create `api-response.dto.ts`:

```ts
export class ApiResponseEnvelopeDto {
  @ApiProperty({ description: '业务成功码，固定为 200', example: 200 })
  code: number

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string

  @ApiProperty({
    description: '响应时间，ISO 8601 格式',
    example: '2026-07-01T00:00:00.000Z',
    format: 'date-time',
  })
  timestamp: string
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: 'HTTP 错误状态码', example: 400 })
  code: number

  @ApiProperty({ description: '错误原因', example: '请求参数错误' })
  message: string

  @ApiProperty({ description: '错误发生时间', format: 'date-time' })
  timestamp: string

  @ApiProperty({ description: '发生错误的请求路径', example: '/api/auth/profile' })
  path: string
}
```

- [ ] **Step 4: Implement the shared decorators**

In `api-response.decorator.ts`, define:

```ts
interface ApiSuccessOptions {
  description?: string
  status?: number
}

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500

export function ApiSuccessResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiSuccessOptions = {},
) {
  const status = options.status ?? 200
  return applyDecorators(
    ApiExtraModels(ApiResponseEnvelopeDto, model),
    ApiResponse({
      status,
      description: options.description,
      schema: {
        title: `ApiResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(ApiResponseEnvelopeDto) },
          { required: ['data'], properties: { data: { $ref: getSchemaPath(model) } } },
        ],
      },
    }),
  )
}

export function ApiArrayResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiSuccessOptions = {},
) {
  const status = options.status ?? 200
  return applyDecorators(
    ApiExtraModels(ApiResponseEnvelopeDto, model),
    ApiResponse({
      status,
      description: options.description,
      schema: {
        title: `ApiArrayResponseOf${model.name}`,
        allOf: [
          { $ref: getSchemaPath(ApiResponseEnvelopeDto) },
          { required: ['data'], properties: { data: { type: 'array', items: { $ref: getSchemaPath(model) } } } },
        ],
      },
    }),
  )
}

export function ApiEmptyResponse(options: ApiSuccessOptions = {}) {
  return applyDecorators(
    ApiExtraModels(ApiResponseEnvelopeDto),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: { $ref: getSchemaPath(ApiResponseEnvelopeDto) },
    }),
  )
}

export function ApiRawResponse<TModel extends Type<unknown>>(
  model: TModel,
  options: ApiSuccessOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status: options.status ?? 200,
      description: options.description,
      schema: { $ref: getSchemaPath(model) },
    }),
  )
}

export function ApiErrorResponses(...statuses: ErrorStatus[]) {
  return applyDecorators(...statuses.map(status => ApiResponse({
    status,
    description: ERROR_DESCRIPTIONS[status],
    type: ApiErrorResponseDto,
  })))
}
```

Import `Type` and `applyDecorators` from `@nestjs/common`; import `ApiExtraModels`, `ApiResponse`, and `getSchemaPath` from `@nestjs/swagger`. Define `ERROR_DESCRIPTIONS` for every `ErrorStatus`, including `429: '请求过于频繁'`. Use `ApiResponse` rather than only `ApiOkResponse`, so `201` can be represented.

- [ ] **Step 5: Run the decorator test**

```bash
pnpm --filter @elm-platform/server run test -- common/swagger/api-response.decorator.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the common infrastructure**

```bash
git add apps/server/src/common/swagger/api-response.dto.ts apps/server/src/common/swagger/api-response.decorator.ts apps/server/src/common/swagger/api-response.decorator.spec.ts
git commit -m "feat(server): add reusable swagger response decorators"
```

## Task 2: Document Admin Authentication and Customer Authentication

**Files:**
- Create: `apps/server/src/modules/auth/dto/auth-response.dto.ts`
- Modify: `apps/server/src/modules/auth/dto/login.dto.ts`
- Modify: `apps/server/src/modules/auth/auth.controller.ts`
- Create: `apps/server/src/modules/customer-auth/dto/customer-auth-response.dto.ts`
- Modify: `apps/server/src/modules/customer-auth/customer-auth.controller.ts`

- [ ] **Step 1: Add a failing auth profile OpenAPI test**

Extend `api-response.decorator.spec.ts` with a fixture that applies `ApiSuccessResponse(AdminProfileResponseDto)`. Assert the generated `AdminProfileResponseDto` schema has these properties:

```ts
expect(profileSchema.properties).toMatchObject({
  id: expect.any(Object),
  username: expect.any(Object),
  email: expect.objectContaining({ nullable: true }),
  phone: expect.objectContaining({ nullable: true }),
  avatar: expect.objectContaining({ nullable: true }),
  status: expect.any(Object),
  role: expect.any(Object),
  permissions: expect.objectContaining({ type: 'array' }),
  dataScope: expect.any(Object),
  boundShopIds: expect.objectContaining({ type: 'array' }),
  tenant: expect.objectContaining({ nullable: true }),
  createdAt: expect.objectContaining({ format: 'date-time' }),
  updatedAt: expect.objectContaining({ format: 'date-time' }),
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

```bash
pnpm --filter @elm-platform/server run test -- common/swagger/api-response.decorator.spec.ts
```

Expected: FAIL because `AdminProfileResponseDto` is missing.

- [ ] **Step 3: Create admin-auth response DTOs**

Define in `auth-response.dto.ts`:

- `AdminTenantResponseDto`: `id`, `code`, `name`, `status`.
- `AdminProfileResponseDto`: exact fields from `AuthService.getProfile`.
- `AdminUpdatedProfileResponseDto`: profile fields returned by `updateProfile`, without undocumented tenant/data-scope fields.
- `AdminMenuResponseDto`: `id`, `parentId`, `title`, `path`, `name`, `icon`, `permission`, `type`, `sort`, `status`, recursive optional `children`.
- `LogoutResponseDto`: `success`.
- `SecurityLogItemResponseDto`: `id`, `userId`, `ip`, `browser`, `os`, `status`, `message`, `createdAt`.
- `SecurityLogsResponseDto`: `list`, `total`, `page`, `pageSize`.

Every property receives Chinese `description`; nullable database fields use `{ nullable: true, type: String }`; date fields use `format: 'date-time'`; menu `type` uses `enum: ['catalog', 'menu', 'button']`.

- [ ] **Step 4: Normalize login response DTO ownership**

Keep request DTOs in `login.dto.ts`. Reuse or move `LoginTenantDto`, `LoginUserDto`, and `LoginResponseDto` into `auth-response.dto.ts`, but remove the duplicated `LoginHttpResponseDto`; the shared decorator now owns the envelope. Update imports without changing request validation.

- [ ] **Step 5: Create customer-auth response DTOs**

Define:

- `CustomerProfileResponseDto`: `id`, `user_id`, `phone`, `mobile`, `username`, nullable `nickname`, `avatar`, `status`.
- `CustomerTokenResponseDto`: `token`, `accessToken`, `expiresIn`, `refreshToken`, `refreshExpiresIn`, `user`.
- `SmsSendResponseDto`: `success` 和可选 `debugCode`；`debugCode` 仅 mock 短信提供器返回。
- `CustomerLogoutResponseDto`: `success`.

- [ ] **Step 6: Decorate both authentication controllers**

Apply:

```ts
@ApiSuccessResponse(LoginResponseDto)
@ApiErrorResponses(400, 401, 500)
```

to login; use the corresponding response DTO on each remaining method. For protected admin/customer profile routes include `401` and `500`; add `400` for query/body validation、`409` for profile/register conflicts、`429` for短信发送频率限制。 Add `@ApiParam` or `@ApiQuery` descriptions where an existing parameter lacks one.

- [ ] **Step 7: Run auth-related tests**

```bash
pnpm --filter @elm-platform/server run test -- common/swagger/api-response.decorator.spec.ts modules/auth/auth.service.spec.ts modules/customer-auth
```

Expected: all selected tests PASS.

- [ ] **Step 8: Commit authentication documentation**

```bash
git add apps/server/src/modules/auth apps/server/src/modules/customer-auth apps/server/src/common/swagger/api-response.decorator.spec.ts
git commit -m "docs(server): describe authentication responses"
```

## Task 3: Document User and Admin Management

**Files:**
- Create: `apps/server/src/modules/user/dto/user-response.dto.ts`
- Modify: `apps/server/src/modules/user/user.controller.ts`
- Create: `apps/server/src/modules/admin/dto/admin-response.dto.ts`
- Modify: `apps/server/src/modules/admin/admin.controller.ts`

- [ ] **Step 1: Create response DTOs from actual Service selections**

`UserResponseDto` must contain exactly:

```ts
id, username, email, phone, avatar, status, role, permissions,
tenantId, dataScope, boundShopIds, createdAt, updatedAt
```

Use `ApiSuccessResponse(UserResponseDto, { status: 201 })` for create, `ApiArrayResponse(UserResponseDto)` for list, and `ApiEmptyResponse()` for the current `void` delete response.

`admin-response.dto.ts` defines focused DTOs for:

- page/button permission strings;
- online user (`id`, `username`, `role`, `ip`, `browser`, `os`, `loginTime`, `lastActiveAt`);
- login, operation and system logs;
- role, menu and department records;
- force-logout and delete operation results.

Before declaring each property, compare it with `AdminService` return maps and Prisma `select` clauses. Do not document fields not returned by the service.

- [ ] **Step 2: Replace description-only user responses**

Replace existing `@ApiResponse({ status, description })` blocks with shared success/error decorators. Preserve the user's uncommitted changes in `user.controller.ts`. Error mapping:

- class protected routes: `401`, `403`, `500`;
- create: `400`, `409`;
- find one: `400`, `404`;
- update: `400`, `404`, `409`;
- delete: `400`, `404`.

- [ ] **Step 3: Decorate every AdminController method**

Use `ApiArrayResponse` for permission, online-user, log, role, menu and department lists. Use `ApiSuccessResponse` for create/update/delete/force-logout. Add class-level `ApiErrorResponses(401, 403, 500)` and method-level `400/404/409` only where the Service or parsing can produce them.

- [ ] **Step 4: Run focused tests and build**

```bash
pnpm --filter @elm-platform/server run test -- modules/user modules/admin
pnpm --filter @elm-platform/server run build
```

Expected: tests PASS and build exits 0.

- [ ] **Step 5: Commit management response documentation**

```bash
git add apps/server/src/modules/user/dto/user-response.dto.ts apps/server/src/modules/user/user.controller.ts apps/server/src/modules/admin/dto/admin-response.dto.ts apps/server/src/modules/admin/admin.controller.ts
git commit -m "docs(server): describe admin management responses"
```

## Task 4: Document Tenant and Merchant Onboarding

**Files:**
- Create: `apps/server/src/modules/tenant/dto/tenant-response.dto.ts`
- Modify: `apps/server/src/modules/tenant/tenant.controller.ts`
- Create: `apps/server/src/modules/merchant-onboarding/dto/merchant-onboarding-response.dto.ts`
- Modify: `apps/server/src/modules/merchant-onboarding/merchant-onboarding.controller.ts`

- [ ] **Step 1: Define tenant response contracts**

Create:

- `TenantResponseDto`: Prisma tenant fields plus `availableActions`.
- `TenantCountResponseDto`: `users`, `orders`.
- `TenantDetailResponseDto`: tenant fields, `_count`, `availableActions`.
- `TenantActionLogResponseDto`: exact `TenantActionLog` fields.

Use enums from `tenant.types.ts` as Swagger enum arrays. Mark contact fields, remark and transition reasons nullable. Dates use `format: 'date-time'`.

- [ ] **Step 2: Define merchant onboarding response contracts**

Create:

- `MerchantApplicationResponseDto`: every property returned by `toApplication`, including normalized materials and `availableActions`.
- `MerchantApplicationActionLogResponseDto`: every property returned by `toActionLog`.

Read `toApplication` and `toActionLog` in full during implementation and mirror their names exactly. `listApplications` is a bare array, not a pagination object, despite accepting page/pageSize query inputs.

- [ ] **Step 3: Apply decorators and error schemas**

Both controllers receive class-level `ApiErrorResponses(401, 403, 500)`.

Tenant mappings:

- list/create: array or object success；create 声明 `400`，未被业务层转换的 Prisma 异常仍按 `500` 描述。
- detail/update/logs: `400/404`.
- transition: `400/404/409`.

Merchant mappings:

- list: array success plus `400`.
- detail/logs: `404`.
- review: `400/404/409`.

- [ ] **Step 4: Run state-machine and module tests**

```bash
pnpm --filter @elm-platform/server run test -- modules/tenant modules/merchant-onboarding
```

Expected: all selected tests PASS.

- [ ] **Step 5: Commit tenant-domain documentation**

```bash
git add apps/server/src/modules/tenant/dto/tenant-response.dto.ts apps/server/src/modules/tenant/tenant.controller.ts apps/server/src/modules/merchant-onboarding/dto/merchant-onboarding-response.dto.ts apps/server/src/modules/merchant-onboarding/merchant-onboarding.controller.ts
git commit -m "docs(server): describe tenant workflow responses"
```

## Task 5: Document Notifications, Payments, and Health

**Files:**
- Create: `apps/server/src/modules/notification/dto/notification-response.dto.ts`
- Modify: `apps/server/src/modules/notification/notification.controller.ts`
- Create: `apps/server/src/modules/payment/dto/payment-response.dto.ts`
- Modify: `apps/server/src/modules/payment/dto/resume-alipay-wap-payment.dto.ts`
- Modify: `apps/server/src/modules/payment/payment.controller.ts`
- Create: `apps/server/src/health/dto/health-response.dto.ts`
- Modify: `apps/server/src/health/health.controller.ts`

- [ ] **Step 1: Define notification DTOs**

Create:

- `NotificationItemResponseDto`: `id`, `userId`, `type`, `title`, `description`, `read`, `source`, `createdAt`, `updatedAt`.
- `UpdatedCountResponseDto`: `updatedCount`.
- `DeletedCountResponseDto`: `deletedCount`.
- `SuccessResponseDto`: `success`.

Decorate list as an array; mark-read as one item; batch and delete results as objects. Use class-level `401/500`, add `400` for query/body validation and `404` for single-item operations.

- [ ] **Step 2: Define payment raw-response DTOs**

Create:

- `AlipayWapPaymentResponseDto`: `orderNo`, `payUrl`, `payableAmount`.
- `PaymentCartItemResponseDto`: `itemId`, `skuId`, `title`, `qty`, `unitPrice`, `totalPrice`.
- `PaymentOrderSummaryResponseDto`: every field returned by `toOrderSummary`, including all fulfillment/refund timestamps and action arrays.
- `PaymentOrdersResponseDto`: `orders`.
- 支付宝异步通知直接使用 `ApiResponse({ schema: { type: 'string', enum: ['success', 'failure'] } })`，不创建伪对象 DTO。

Reuse `AlipayWapPaymentResponseDto` for create and resume; remove the duplicate response DTO from `resume-alipay-wap-payment.dto.ts`.

- [ ] **Step 3: Preserve raw payment contracts**

Apply `ApiRawResponse` to create/resume/status/refund/order-list endpoints because they call `rawResponse()`. Do not wrap their Swagger schemas in `ApiResponseEnvelopeDto`. Error responses still use `ApiErrorResponseDto`, because thrown exceptions are handled by `AllExceptionsFilter`.

Map errors:

- guarded routes: `401/500`;
- create/resume: `400/401/404`;
- status: `401/404/500`;
- refund: `400/401/404/409/500`;
- list: `401/500`;
- notify: raw string success and `500`.

- [ ] **Step 4: Define and apply health DTOs**

Create:

- `HealthDependencyResponseDto`: `status: 'ok' | 'error'`, `detail`.
- `HealthDependenciesResponseDto`: `database`, `redis`.
- `HealthResponseDto`: `status: 'ok' | 'degraded'`, `timestamp`, `uptime`, `dependencies`.

Health uses `ApiSuccessResponse(HealthResponseDto)` because it does not bypass `TransformInterceptor`, plus a `500` schema for unexpected failures.

- [ ] **Step 5: Run focused tests**

```bash
pnpm --filter @elm-platform/server run test -- modules/notification modules/payment health
```

Expected: all selected tests PASS.

- [ ] **Step 6: Commit remaining module documentation**

```bash
git add apps/server/src/modules/notification apps/server/src/modules/payment apps/server/src/health
git commit -m "docs(server): describe notification payment and health responses"
```

## Task 6: Add Non-Elm Swagger Coverage Tests

**Files:**
- Create: `apps/server/src/common/swagger/swagger-response-coverage.spec.ts`

- [ ] **Step 1: Write the controller response metadata matrix**

Import these Controller classes only:

```ts
HealthController
AdminController
AuthController
CustomerAuthController
MerchantOnboardingController
NotificationController
PaymentController
TenantController
UserController
```

Create the complete matrix below. HTTP `201` is intentional for POST handlers without `@HttpCode(200)`; the envelope body still contains `code: 200`.

```ts
const controllerEntries = [
  { controller: HealthController, method: 'check', success: 200, errors: [500] },
  { controller: AuthController, method: 'login', success: 200, errors: [400, 401, 500] },
  { controller: AuthController, method: 'getProfile', success: 200, errors: [401, 500] },
  { controller: AuthController, method: 'getMenus', success: 200, errors: [401, 500] },
  { controller: AuthController, method: 'updateProfile', success: 200, errors: [400, 401, 409, 500] },
  { controller: AuthController, method: 'logout', success: 201, errors: [401, 500] },
  { controller: AuthController, method: 'getSecurityLogs', success: 200, errors: [400, 401, 500] },
  { controller: CustomerAuthController, method: 'sendSms', success: 201, errors: [400, 429, 500] },
  { controller: CustomerAuthController, method: 'register', success: 201, errors: [400, 409, 500] },
  { controller: CustomerAuthController, method: 'loginByPassword', success: 201, errors: [400, 401, 500] },
  { controller: CustomerAuthController, method: 'loginBySms', success: 201, errors: [400, 401, 500] },
  { controller: CustomerAuthController, method: 'refresh', success: 201, errors: [400, 401, 500] },
  { controller: CustomerAuthController, method: 'logout', success: 201, errors: [400, 500] },
  { controller: CustomerAuthController, method: 'getProfile', success: 200, errors: [401, 500] },
  { controller: AdminController, method: 'getPagePermissions', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'getButtonPermissions', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'getOnlineUsers', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'forceLogout', success: 201, errors: [400, 401, 403, 500] },
  { controller: AdminController, method: 'getLoginLogs', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'getOperationLogs', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'getSystemLogs', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'getRoles', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'createRole', success: 201, errors: [400, 401, 403, 500] },
  { controller: AdminController, method: 'updateRole', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: AdminController, method: 'deleteRole', success: 200, errors: [400, 401, 403, 500] },
  { controller: AdminController, method: 'getMenus', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'createMenu', success: 201, errors: [400, 401, 403, 500] },
  { controller: AdminController, method: 'updateMenu', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: AdminController, method: 'deleteMenu', success: 200, errors: [400, 401, 403, 500] },
  { controller: AdminController, method: 'getDepts', success: 200, errors: [401, 403, 500] },
  { controller: AdminController, method: 'createDept', success: 201, errors: [400, 401, 403, 500] },
  { controller: AdminController, method: 'updateDept', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: AdminController, method: 'deleteDept', success: 200, errors: [400, 401, 403, 500] },
  { controller: UserController, method: 'create', success: 201, errors: [400, 401, 403, 409, 500] },
  { controller: UserController, method: 'findAll', success: 200, errors: [401, 403, 500] },
  { controller: UserController, method: 'findOne', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: UserController, method: 'update', success: 200, errors: [400, 401, 403, 404, 409, 500] },
  { controller: UserController, method: 'remove', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: TenantController, method: 'listTenants', success: 200, errors: [401, 403, 500] },
  { controller: TenantController, method: 'createTenant', success: 201, errors: [400, 401, 403, 500] },
  { controller: TenantController, method: 'getTenantDetail', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: TenantController, method: 'updateTenant', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: TenantController, method: 'transitionTenant', success: 201, errors: [400, 401, 403, 404, 409, 500] },
  { controller: TenantController, method: 'getTenantActionLogs', success: 200, errors: [400, 401, 403, 404, 500] },
  { controller: MerchantOnboardingController, method: 'listApplications', success: 200, errors: [400, 401, 403, 500] },
  { controller: MerchantOnboardingController, method: 'getApplicationDetail', success: 200, errors: [401, 403, 404, 500] },
  { controller: MerchantOnboardingController, method: 'reviewApplication', success: 201, errors: [400, 401, 403, 404, 409, 500] },
  { controller: MerchantOnboardingController, method: 'getApplicationActionLogs', success: 200, errors: [401, 403, 404, 500] },
  { controller: NotificationController, method: 'list', success: 200, errors: [400, 401, 500] },
  { controller: NotificationController, method: 'markAllRead', success: 200, errors: [400, 401, 500] },
  { controller: NotificationController, method: 'markRead', success: 200, errors: [401, 404, 500] },
  { controller: NotificationController, method: 'remove', success: 200, errors: [401, 404, 500] },
  { controller: NotificationController, method: 'clear', success: 200, errors: [400, 401, 500] },
  { controller: PaymentController, method: 'createAlipayWapPayment', success: 201, errors: [400, 401, 500] },
  { controller: PaymentController, method: 'resumeAlipayWapPayment', success: 200, errors: [400, 401, 404, 500] },
  { controller: PaymentController, method: 'getAlipayPaymentStatus', success: 200, errors: [401, 404, 500] },
  { controller: PaymentController, method: 'requestRefund', success: 201, errors: [400, 401, 404, 409, 500] },
  { controller: PaymentController, method: 'handleAlipayNotify', success: 201, errors: [500] },
  { controller: PaymentController, method: 'listOrders', success: 200, errors: [401, 500] },
] as const
```

Do not import any controller from `modules/elm`.

- [ ] **Step 2: Implement metadata assertions**

Read Swagger response metadata from the class and method:

```ts
const API_RESPONSE_METADATA = 'swagger/apiResponse'

function getResponses(controller: Type<unknown>, method: string) {
  const classResponses = Reflect.getMetadata(API_RESPONSE_METADATA, controller) ?? {}
  const handler = controller.prototype[method]
  const methodResponses = Reflect.getMetadata(API_RESPONSE_METADATA, handler) ?? {}
  return { ...classResponses, ...methodResponses }
}
```

For every matrix item, assert the success status and all listed errors exist and contain a schema/type. Import `PATH_METADATA` from `@nestjs/common/constants`, enumerate each imported Controller prototype method carrying that metadata, and assert that the sorted route-method names exactly equal the sorted matrix method names for that Controller. This makes a newly added non-`elm` route fail until its response contract is documented. Add a separate source guard:

```ts
expect(controllerEntries.some(entry =>
  String(entry.controller).includes('Elm'),
)).toBe(false)
```

- [ ] **Step 3: Run the coverage test**

```bash
pnpm --filter @elm-platform/server run test -- common/swagger/swagger-response-coverage.spec.ts
```

Expected: PASS and every non-`elm` route method is represented.

- [ ] **Step 4: Run a route inventory audit**

```powershell
Get-ChildItem apps/server/src -Recurse -Filter '*.controller.ts' |
  Where-Object { $_.FullName -notmatch '[\\]elm[\\]' } |
  Select-String -Pattern '@(Get|Post|Patch|Put|Delete)\('
```

Compare the count and method names with the test matrix. Expected: no route is absent from the matrix.

- [ ] **Step 5: Commit coverage enforcement**

```bash
git add apps/server/src/common/swagger/swagger-response-coverage.spec.ts
git commit -m "test(server): enforce swagger response coverage"
```

## Task 7: Verify the Generated OpenAPI Contract

**Files:**
- Modify only if verification reveals a concrete schema defect.

- [ ] **Step 1: Run both Swagger tests together**

```bash
pnpm --filter @elm-platform/server run test -- common/swagger
```

Expected: all Swagger tests PASS.

- [ ] **Step 2: Inspect the auth profile schema**

Start the backend with its configured dependencies available:

```bash
pnpm --filter @elm-platform/server run start:dev
```

Open `http://localhost:3000/api-docs-json` or the JSON URL configured by Swagger UI. Verify `GET /api/auth/profile` has:

```text
200 -> code, message, data, timestamp
data -> id, username, email, phone, avatar, status, role, permissions,
        dataScope, boundShopIds, tenant, createdAt, updatedAt
401 -> code, message, timestamp, path
500 -> code, message, timestamp, path
```

Stop the server after inspection.

- [ ] **Step 3: Inspect representative response shapes**

Check one endpoint from each category:

- array envelope: `GET /api/users`;
- nested envelope: `GET /api/auth/menus`;
- state workflow: `POST /api/admin/tenants/{id}/events/{event}`;
- raw response: `GET /api/payments/alipay/status/{orderNo}`;
- health envelope: `GET /api/health`.

Expected: arrays have typed `items`, nested objects are expandable, raw payment responses have no envelope, and every field has a description.

- [ ] **Step 4: Confirm elm files are untouched**

```bash
git diff HEAD~6 -- apps/server/src/modules/elm
```

Expected: no output attributable to this implementation. If unrelated pre-existing changes exist, compare against the pre-implementation commit instead of reverting them.

## Task 8: Full Verification and Completion Audit

**Files:**
- No source changes expected unless verification reveals a defect.

- [ ] **Step 1: Run all server tests**

```bash
pnpm --filter @elm-platform/server run test
```

Expected: all Jest suites PASS.

- [ ] **Step 2: Run lint**

```bash
pnpm --filter @elm-platform/server run lint
```

Expected: exit code 0. Review lint's `--fix` changes and retain only formatting in files touched by this work.

- [ ] **Step 3: Run the production build**

```bash
pnpm --filter @elm-platform/server run build
```

Expected: Nest build exits 0 with no TypeScript errors.

- [ ] **Step 4: Audit DTO field descriptions**

```powershell
Get-ChildItem apps/server/src -Recurse -Filter '*response.dto.ts' |
  Where-Object { $_.FullName -notmatch '[\\]elm[\\]' } |
  Select-String -Pattern '@ApiProperty\(\{\s*\}\)'
```

Expected: no empty `ApiProperty` declarations. Manually confirm every property declaration is preceded by `ApiProperty` or `ApiPropertyOptional` with a Chinese `description`.

- [ ] **Step 5: Audit final scope**

```bash
git status --short
git diff -- apps/server/src/modules/elm
```

Expected:

- no `elm` diff from this work;
- no generated `dist`, coverage or cache files staged;
- existing unrelated workspace changes remain untouched;
- implementation commits contain only Swagger DTOs, decorators, Controller metadata and tests.

- [ ] **Step 6: Record completion evidence**

The final report must include:

- common Swagger test result;
- non-`elm` route coverage result;
- full Jest, lint and build results;
- `/api/auth/profile` schema confirmation;
- raw payment schema confirmation;
- explicit confirmation that `apps/server/src/modules/elm/**` was not modified.

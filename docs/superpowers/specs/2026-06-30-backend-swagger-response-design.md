# 后端 Swagger 响应文档统一完善设计

## 背景

后端目前由全局 `TransformInterceptor` 将大多数成功响应包装为：

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2026-06-30T00:00:00.000Z"
}
```

全局 `AllExceptionsFilter` 将异常响应统一为：

```json
{
  "code": 400,
  "message": "请求参数错误",
  "timestamp": "2026-06-30T00:00:00.000Z",
  "path": "/api/example"
}
```

现有 Swagger 文档多数接口只提供操作摘要，缺少成功响应 Schema、字段说明和错误响应。部分已有文档直接标注业务 DTO，未体现全局响应包装。例如 `GET /api/auth/profile` 没有响应类型，无法从 Swagger 了解用户资料字段。

## 目标

1. 为所有非 `elm` 后端接口补齐准确的成功响应 Schema。
2. 为响应字段提供中文说明、示例、枚举、数组元素类型、嵌套结构和可空性。
3. 按接口真实场景补齐 `400/401/403/404/409/500` 错误响应。
4. 建立可复用的 Swagger 响应装饰器，降低新增接口的文档维护成本。
5. 保持运行时响应协议和业务行为不变。

## 范围

覆盖以下控制器：

- `src/health/health.controller.ts`
- `src/modules/admin/admin.controller.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/customer-auth/customer-auth.controller.ts`
- `src/modules/merchant-onboarding/merchant-onboarding.controller.ts`
- `src/modules/notification/notification.controller.ts`
- `src/modules/payment/payment.controller.ts`
- `src/modules/tenant/tenant.controller.ts`
- `src/modules/user/user.controller.ts`

明确排除：

- `src/modules/elm/**` 下的全部兼容接口。
- 运行时响应结构调整。
- 与 Swagger 文档无关的业务重构。

## 公共 Swagger 基础设施

在 `src/common/swagger` 中建立公共模型和装饰器。

### 公共模型

`ApiResponseEnvelopeDto` 描述成功响应公共字段：

- `code`: HTTP 成功状态码。
- `message`: 成功提示。
- `timestamp`: ISO 8601 响应时间。

`ApiErrorResponseDto` 描述异常响应：

- `code`: HTTP 错误状态码。
- `message`: 错误原因。运行时数组校验消息会由异常过滤器取第一项，因此文档类型为字符串。
- `timestamp`: ISO 8601 响应时间。
- `path`: 请求路径。

### 公共装饰器

- `ApiSuccessResponse(DataDto, options?)`: 描述 `data` 为单个对象的统一响应，支持指定状态码和说明。
- `ApiArrayResponse(ItemDto, options?)`: 描述 `data` 为数组的统一响应。
- `ApiRawResponse(ResponseDto, options?)`: 描述绕过全局包装的原始响应。
- `ApiErrorResponses(statuses, options?)`: 根据传入状态码复用统一错误 Schema，并提供对应错误说明。

装饰器使用 NestJS 官方推荐的 `ApiExtraModels`、`getSchemaPath` 和 OpenAPI `allOf` 组合公共 envelope 与具体业务 DTO。生成的 Schema 设置稳定且可读的标题，便于 Swagger UI 和类型生成工具识别。

## 业务响应 DTO

每个模块在自己的 `dto` 目录维护响应 DTO。DTO 必须与 Service 实际选择和返回的字段一致，不直接把 Prisma 完整模型暴露为文档契约。

### Auth

- 登录令牌、有效期、管理员用户和租户信息。
- 当前管理员资料，包括权限、数据范围、绑定门店、租户及创建/更新时间。
- 菜单树及递归子菜单。
- 更新后的管理员资料。
- 退出结果。
- 安全日志分页，包括日志项、总数、页码和每页数量。

`GET /api/auth/profile` 必须展示完整统一响应 envelope，并使 `data` 下所有字段均可展开且有中文说明。

### Customer Auth

- 短信发送结果。
- 注册、密码登录、短信登录和刷新令牌结果。
- 退出结果。
- 普通用户资料。

### Admin

- 页面权限和按钮权限列表。
- 在线用户列表及强制下线结果。
- 登录日志、操作日志和系统日志。
- 角色、菜单、部门的列表、创建、更新和删除结果。

### User

- 用户详情。
- 用户列表。
- 创建和更新后的用户。
- 删除结果。

### Tenant

- 租户列表和详情。
- 创建、更新和状态流转结果。
- 租户动作日志。

### Merchant Onboarding

- 商户申请列表及分页信息。
- 商户申请详情。
- 审核结果。
- 申请动作日志。

### Notification

- 通知列表及未读统计。
- 单条或批量已读结果。
- 删除和清空结果。

### Payment

支付控制器通过 `rawResponse()` 主动绕过全局包装，因此使用 `ApiRawResponse`，保持现有协议：

- 创建和恢复支付宝 WAP 支付。
- 支付状态查询。
- 退款申请结果。
- 用户订单列表。
- 支付宝异步通知的字符串响应。

### Health

- 服务状态、依赖状态和检查时间等健康检查字段。

## 控制器应用规则

1. 每个接口必须声明一个与实际 HTTP 状态一致的成功响应。
2. 返回统一 envelope 的单对象接口使用 `ApiSuccessResponse`。
3. 返回统一 envelope 的数组接口使用 `ApiArrayResponse`。
4. 业务返回值本身包含分页字段时，使用对应分页 DTO 作为 `data`，不把分页误写为裸数组。
5. 使用 `rawResponse()` 的接口只使用 `ApiRawResponse`。
6. 受 Guard 保护的接口声明 `401`；存在权限控制时同时声明 `403`。
7. 参数校验可能失败的接口声明 `400`。
8. 查询或修改指定资源的接口按实际 Service 行为声明 `404`。
9. 唯一键冲突或非法状态流转按实际 Service 行为声明 `409`。
10. `500` 使用统一错误 Schema，作为未预期服务异常说明。

错误状态码可以在控制器类级复用，但接口特有错误必须保留在方法级，避免文档声明与实现不符。

## 数据流

正常响应的数据流保持不变：

1. Controller 调用 Service。
2. Service 返回业务数据。
3. `TransformInterceptor` 生成统一成功 envelope，或 `rawResponse()` 直接返回既有协议。
4. Swagger 装饰器仅描述该运行时结果，不参与序列化。

异常数据流保持不变：

1. Guard、Pipe、Controller 或 Service 抛出异常。
2. `AllExceptionsFilter` 生成统一错误响应。
3. Swagger 错误装饰器描述相同字段结构。

## 测试与验收

### 公共装饰器单元测试

- 单对象成功响应正确引用业务 DTO。
- 数组成功响应包含正确的 `items.$ref`。
- 非默认成功状态码和说明能够透传。
- 原始响应不会包含统一 envelope。
- 错误响应引用 `ApiErrorResponseDto`，且状态码说明正确。

### OpenAPI 文档测试

使用 Nest 测试应用调用 `SwaggerModule.createDocument`，验证：

- 所有非 `elm` 路由均存在成功响应 Schema。
- 所有受保护接口均包含 `401`，权限接口包含 `403`。
- 资源查询、校验和冲突接口包含对应错误响应。
- `/api/auth/profile` 的成功响应包含 `code`、`message`、`data`、`timestamp`。
- 管理员资料 `data` 包含完整字段、嵌套租户和数组字段说明。
- 支付原始响应未被错误包裹。
- `elm` 控制器文件和兼容接口未被此次改造。

### 工程验证

- 运行后端相关 Jest 测试。
- 运行后端 lint。
- 运行后端 build。
- 必要时生成 OpenAPI JSON，人工抽查 Swagger UI 中对象展开、字段说明和示例。

## 完成标准

- 范围内每个接口都有准确的成功响应 Schema。
- 范围内每个响应业务字段都有清晰说明，不存在无定义的通用 `object`。
- 错误响应结构与 `AllExceptionsFilter` 一致。
- `/api/auth/profile` 文档完整展示当前管理员资料。
- 支付原始协议和所有运行时业务行为保持不变。
- `src/modules/elm/**` 没有代码改动。
- 后端测试、lint 和 build 通过。

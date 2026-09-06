# Elm 上游商品目录代理设计

## 背景

当前用户端通过本地 Nest 服务的 `/api` 前缀访问 Elm 兼容接口，但以下公开读接口仍从 `ElmStoreService` 的内存种子数据取数：

- `GET /api/shopping/restaurants`
- `GET /api/v2/index_entry`
- `GET /api/shopping/v2/menu?restaurant_id=:id`
- `GET /api/shopping/restaurant/:shopId`

商铺列表、食品分类和菜单需要改用 `https://elm.cangdu.org` 的真实数据。商铺详情也必须同步切换，否则从上游列表取得的商铺 ID 可能无法在本地种子数据中命中。

## 目标

- 保持 web-user 当前 `/api/...` 调用路径和响应数据结构不变。
- 由 Nest 服务端代理 `elm.cangdu.org`，避免浏览器跨域和多环境配置分散。
- 四个商品目录相关读接口不再读取或回退本地种子数据。
- 集中处理上游地址、查询参数、超时、响应解析和错误映射。
- 为代理行为提供确定性的单元测试，并通过服务端构建验证。

## 非目标

- 不修改商铺和商品的新增、更新、删除等后台管理接口。
- 不移除 `ElmStoreService` 中仍被其他兼容接口和管理功能使用的种子数据。
- 不代理评价、订单、城市定位或其他未列出的 Elm 接口。
- 不在本次改造中新增缓存、重试、熔断或数据持久化。
- 不修改 web-user 的页面、组件或现有 API 调用函数。

## 方案选择

采用独立的 `ElmUpstreamService`，由现有公开 Controller 调用。

相比在每个 Controller 中直接调用 `fetch`，该方案能复用超时、参数序列化、错误处理和配置读取逻辑；相比由前端直连上游，该方案保留了项目现有的统一 `/api` 边界，避免跨域和客户端环境差异。

## 架构与职责

### `ElmUpstreamService`

新增服务负责：

- 从配置读取上游基址，默认 `https://elm.cangdu.org`。
- 从配置读取请求超时，默认 8000 毫秒。
- 仅请求调用方传入的固定相对路径，不接受完整外部 URL。
- 将 Nest 查询对象序列化为 URL 查询参数。
- 对数组参数逐项追加，保留重复参数语义。
- 使用 `AbortController` 限制请求时间。
- 解析 JSON 并直接返回上游数据。
- 将网络错误、超时、非 2xx 响应和非法 JSON 映射为 `BadGatewayException`。

服务不读取 `ElmStoreService`，也不提供种子数据降级逻辑。

### Controller

现有 Controller 保留路由和 Swagger 描述，只把四个读取方法改为异步代理：

| 本地接口 | 上游接口 |
| --- | --- |
| `GET /api/shopping/restaurants` | `GET /shopping/restaurants` |
| `GET /api/v2/index_entry` | `GET /v2/index_entry` |
| `GET /api/shopping/v2/menu` | `GET /shopping/v2/menu` |
| `GET /api/shopping/restaurant/:shopId` | `GET /shopping/restaurant/:shopId` |

Controller 必须先 `await` 上游结果，再调用 `rawResponse`，确保全局响应拦截器返回上游 JSON 本身，而不是包装 Promise。

`shopping/restaurants` 透传所有收到的查询参数，以兼容经纬度、分页、分类、排序、配送方式和商家属性筛选。`shopping/v2/menu` 透传 `restaurant_id`。食品分类没有查询参数。商铺详情只把经过 `ParseIntPipe` 校验的 `shopId` 放入固定路径。

### 配置

在服务端配置中增加：

- `elmApi.baseUrl`：来自 `ELM_API_BASE_URL`，默认 `https://elm.cangdu.org`。
- `elmApi.timeoutMs`：来自 `ELM_API_TIMEOUT_MS`，默认 `8000`。

同时在 `apps/server/.env.example` 中记录这两个变量。基址在使用前移除末尾斜杠，避免拼接出双斜杠。

## 数据流

1. web-user 继续请求本地 `/api` 接口。
2. Vite 开发代理把请求转发给本地 Nest 服务。
3. Controller 校验路径参数并收集查询参数。
4. `ElmUpstreamService` 使用固定路径构造上游 URL，发起限时 GET 请求。
5. 上游成功返回 JSON 后，Controller 通过 `rawResponse` 原样交给前端。
6. web-user 继续使用现有数据结构渲染商铺、分类、菜单和详情。

图片字段不做转换。web-user 的 `getImageUrl` 与 `IMAGE_BASE_URL` 已指向 `https://elm.cangdu.org/img/`，可继续解析上游返回的 `image_path` 和 `image_url`。

## 查询参数规则

- 忽略值为 `undefined` 或 `null` 的参数。
- 标量使用字符串形式追加。
- 数组按原顺序重复追加同名参数。
- 不转发请求头、Cookie、授权信息或请求体。
- 不允许查询参数改变协议、主机或固定上游路径。

这些规则既保留 Elm 列表筛选能力，也避免把该服务变成开放代理。

## 错误处理

- 上游返回非 2xx：本地返回 HTTP 502。
- 网络连接失败或 DNS 错误：本地返回 HTTP 502。
- 请求超过配置时间：中止请求并返回 HTTP 502。
- 上游响应无法解析为 JSON：本地返回 HTTP 502。

错误消息应说明失败接口和失败类型，但不向客户端暴露内部堆栈。服务端日志保留可诊断的上游状态或原始错误。任何失败都不回退到 `seedRestaurants`、`seedMenuCategories` 或 `seedFoods`。

## 测试策略

### `ElmUpstreamService` 单元测试

通过 mock `global.fetch` 覆盖：

- 使用默认或配置后的基址构造 URL。
- 正确拼接标量查询参数。
- 正确追加数组和重复查询参数。
- 忽略 `null` 与 `undefined`。
- 成功响应返回解析后的原始 JSON。
- 非 2xx 响应抛出 `BadGatewayException`。
- 网络错误映射为 `BadGatewayException`。
- 超时触发中止并映射为 `BadGatewayException`。
- 非法 JSON 映射为 `BadGatewayException`。

### Controller 单元测试

通过 mock `ElmUpstreamService` 验证：

- 四个本地路由分别调用正确的固定上游路径。
- 商铺列表查询对象完整传给代理服务。
- 菜单的 `restaurant_id` 正确传递。
- 商铺详情 ID 进入固定路径。
- 返回值保持 `rawResponse` 语义，不增加 `{ code, data, message }` 包装。

### 验证命令

- 运行新增的服务端 Jest 测试。
- 运行受影响的 Elm 模块测试。
- 运行 `pnpm --filter @elm-platform/server run build`。
- 在网络可用时，对四个上游 GET 接口执行只读冒烟请求。

## 兼容性与风险

- 上游服务不可用时，用户端商品目录会明确失败，不再显示陈旧的本地样例数据；这是“不使用自己的种子数据”的预期行为。
- 上游接口结构若发生变化，前端可能需要后续适配。本次保持原样转发，以当前 `API.md` 和既有页面模型为契约。
- 当前 web-user 请求层对 GET 请求有重试策略，因此一次上游故障可能产生多次本地请求；本次不在服务端重复添加重试，避免重试叠加。
- 本地后台管理数据与用户端展示数据在本次改造后属于不同来源。由于后台写接口不在需求范围内，本次保留其现有行为，并在后续需要统一管理上游数据时另行设计。

## 完成标准

- 四个公开读接口从 `elm.cangdu.org` 返回数据。
- 四个接口的实现路径不读取商品相关种子集合，也不在失败时降级。
- web-user 无需修改即可展示上游商铺、食品分类、菜单和商铺详情。
- 上游异常统一产生可诊断的 502。
- 新增测试通过，服务端构建通过。

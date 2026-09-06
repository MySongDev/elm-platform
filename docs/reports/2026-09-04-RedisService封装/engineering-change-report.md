---
date: 2026-09-04
type: 工程变更
tech: [NestJS, TypeScript, Redis, ioredis]
change: 2026-09-04-RedisService封装
---

# 工程变更报告：收紧 RedisService 封装并移除业务层 getClient()

## 变更背景

项目后端已经通过 `RedisService` 统一提供 Redis 访问能力，但此前仍然暴露了底层 `ioredis` 客户端：

```ts
getClient(): Redis {
  return this.client
}
```

多个业务服务通过 `getClient()` 直接调用 `keys`、`ping`、`sadd`、`srem`、`smembers` 和 `del`。这样虽然当前功能可以运行，但业务层实际上依赖了 `ioredis` 的具体 API，导致：

- `RedisService` 的抽象边界不完整；
- 以后迁移到 `node-redis` 时，业务层也要同步修改命令名称和参数格式；
- Redis 连接客户端类型被传播到业务模块；
- 测试 mock 需要模拟底层客户端结构，而不是模拟业务需要的 Redis 能力。

本次改动承接了“暂不迁移 ioredis，先完善 RedisService”的决定，目标是让业务层只依赖 Redis 能力方法，而不依赖具体客户端。

## 变更目标

1. 删除 `RedisService.getClient()`。
2. 将当前业务实际使用的 Redis 操作收敛到 `RedisService`。
3. 修改业务服务，使其不再直接调用 `ioredis` 客户端。
4. 同步更新受影响的单元测试 mock。
5. 修正 `set` 方法对 TTL 的判断，使 `ttl` 是否传入的语义更加明确。

本次不包含：

- `ioredis` 到 `node-redis` 的迁移；
- Redis 连接重试策略重构；
- Redis Cluster、Sentinel、Pipeline 或事务支持；
- Redis 键命名策略重构。

## 修改方案

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 在 RedisService 中增加具体能力方法，移除 getClient | 是 | 改动范围可控，立即解除业务层对 ioredis 的直接依赖 |
| 保留 getClient，仅约定业务层不要使用 | 否 | 约束依赖代码规范，无法从类型和 API 层面阻止误用 |
| 立即迁移到 node-redis | 否 | 当前没有功能或稳定性需求，迁移会扩大变更范围；先完成抽象更适合后续迁移 |

## 操作步骤

### 步骤 1：检查 Redis 使用位置

```bash
rg "getClient\(\)" apps/server/src
```

检查结果显示 `getClient()` 出现在以下生产代码：

```text
apps/server/src/redis/redis.service.ts
apps/server/src/health/health.service.ts
apps/server/src/modules/admin/admin.service.ts
apps/server/src/modules/customer-auth/customer-token.service.ts
```

同时确认业务实际使用的底层命令包括：

```text
keys
ping
sadd
srem
smembers
del
```

这一步用于确定 RedisService 需要补充哪些最小能力，而不是一次性暴露完整客户端 API。

### 步骤 2：扩展 RedisService

在 `apps/server/src/redis/redis.service.ts` 中增加以下能力方法：

```ts
async keys(pattern: string): Promise<string[]> {
  return this.client.keys(pattern)
}
```

这个方法将键扫描能力封装在基础设施层。业务层只需要传入匹配模式，不需要知道底层客户端的类型。

```ts
async addToSet(key: string, ...members: string[]): Promise<number> {
  return this.client.sadd(key, ...members)
}

async removeFromSet(key: string, ...members: string[]): Promise<number> {
  return this.client.srem(key, ...members)
}

async getSetMembers(key: string): Promise<string[]> {
  return this.client.smembers(key)
}
```

这三个方法表达的是集合能力，而不是暴露 `ioredis` 命令。以后更换客户端时，可以只在这里处理 `sadd`/`sAdd` 等 API 差异。

```ts
async ping(): Promise<string> {
  return this.client.ping()
}
```

健康检查和运行态日志只需要 Redis 连通性，不需要拿到客户端实例，因此由 `RedisService` 直接提供 `ping()`。

同时删除：

```ts
getClient(): Redis {
  return this.client
}
```

### 步骤 3：修正 TTL 判断

将 `RedisService.set()` 中的判断从：

```ts
if (ttl) {
  await this.client.set(key, val, 'EX', ttl)
}
```

调整为：

```ts
if (ttl !== undefined) {
  await this.client.set(key, val, 'EX', ttl)
}
```

这一步区分“没有传入 TTL”和“传入了数值 0”。当前调用方传入的 TTL 都是正整数，但 `ttl !== undefined` 能够准确表达参数是否存在。Redis 是否接受 `0` 仍由底层命令校验，本次没有额外改变 TTL 合法性策略。

### 步骤 4：迁移业务服务调用

`HealthService` 从：

```ts
const pong = await this.redis.getClient().ping()
```

调整为：

```ts
const pong = await this.redis.ping()
```

`AdminService` 从：

```ts
const client = this.redis.getClient()
const keys = await client.keys('admin:online:*')
```

调整为：

```ts
const keys = await this.redis.keys('admin:online:*')
```

`CustomerTokenService` 中的集合操作从：

```ts
await this.redis.getClient().sadd(userKey, tokenId)
await this.redis.getClient().srem(userKey, tokenId)
const tokenIds = await this.redis.getClient().smembers(userKey)
```

调整为：

```ts
await this.redis.addToSet(userKey, tokenId)
await this.redis.removeFromSet(userKey, tokenId)
const tokenIds = await this.redis.getSetMembers(userKey)
```

普通键的删除统一使用已有封装：

```ts
await this.redis.del(key)
```

迁移后，业务代码不再持有 Redis client，也不再直接依赖 `ioredis` 的命令命名。

### 步骤 5：同步测试 mock

将测试中原来的嵌套 mock：

```ts
const redis = {
  getClient: jest.fn().mockReturnValue({
    ping: jest.fn().mockResolvedValue('PONG'),
  }),
}
```

改为直接 mock RedisService 能力：

```ts
const redis = {
  ping: jest.fn().mockResolvedValue('PONG'),
}
```

CustomerTokenService 测试也从 mock 底层 `client.sadd`、`client.srem`、`client.smembers` 改为 mock：

```ts
const redis = {
  addToSet: jest.fn(),
  removeFromSet: jest.fn(),
  getSetMembers: jest.fn(),
}
```

这样测试验证的是业务服务依赖的抽象，而不是 `getClient()` 的实现细节。

### 步骤 6：检查残留调用

```bash
rg "getClient\(\)" apps/server/src
```

输出：

```text
No matches found
```

这说明生产代码已经没有 `getClient()` 调用或定义。

### 步骤 7：检查变更空白

```bash
git diff --check -- apps/server/src/redis/redis.service.ts apps/server/src/health/health.service.ts apps/server/src/health/tests/health.service.spec.ts apps/server/src/modules/admin/admin.service.ts apps/server/src/modules/admin/tests/admin.service.spec.ts apps/server/src/modules/customer-auth/customer-token.service.ts apps/server/src/modules/customer-auth/tests/customer-token.service.spec.ts
```

命令无输出，表示本次涉及文件没有发现 Git 可识别的空白错误。

### 步骤 8：构建后端

```bash
pnpm --filter @elm-platform/server run build
```

输出：

```text
$ nest build
```

命令退出码为 `0`，后端 TypeScript 编译通过。

### 步骤 9：运行 Redis 相关测试

```bash
pnpm --filter @elm-platform/server run test -- --runInBand src/modules/customer-auth/tests/customer-token.service.spec.ts src/modules/admin/tests/admin.service.spec.ts src/health/tests/health.service.spec.ts
```

输出摘要：

```text
Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
```

### 步骤 10：运行 ESLint

```bash
pnpm --filter @elm-platform/server exec eslint src/redis/redis.service.ts src/health/health.service.ts src/modules/admin/admin.service.ts src/modules/customer-auth/customer-token.service.ts src/health/tests/health.service.spec.ts src/modules/admin/tests/admin.service.spec.ts src/modules/customer-auth/tests/customer-token.service.spec.ts
```

结果：没有错误，但项目现有测试和 `AdminService` 中仍有若干 `no-explicit-any` 警告。这些警告不是本次 Redis 封装引入的，也不影响本次构建和测试结果。

## 修改内容

### 1. `apps/server/src/redis/redis.service.ts` — 收紧基础设施 API

- 删除 `getClient()`。
- 增加 `keys()`、`ping()`、`addToSet()`、`removeFromSet()`、`getSetMembers()`。
- 将 TTL 判断从 truthy 判断改为 `ttl !== undefined`。

### 2. `apps/server/src/health/health.service.ts` — 使用 RedisService.ping()

健康检查不再获取底层客户端，直接通过 `this.redis.ping()` 检查 Redis 连通性。

### 3. `apps/server/src/modules/admin/admin.service.ts` — 使用 RedisService.keys()/ping()

在线用户查询和运行态系统日志中的 Redis 探测都改为调用 RedisService 的方法。

### 4. `apps/server/src/modules/customer-auth/customer-token.service.ts` — 使用集合能力方法

refresh token 的集合增删、集合读取和普通键删除全部通过 RedisService 完成。

### 5. 测试文件

同步修改以下测试 mock，使测试对象直接符合新的 RedisService 使用方式：

- `apps/server/src/health/tests/health.service.spec.ts`
- `apps/server/src/modules/admin/tests/admin.service.spec.ts`
- `apps/server/src/modules/customer-auth/tests/customer-token.service.spec.ts`

## 涉及文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `apps/server/src/redis/redis.service.ts` | 修改 | 增加 Redis 能力方法，删除 `getClient()`，修正 TTL 判断 |
| `apps/server/src/health/health.service.ts` | 修改 | 使用 `RedisService.ping()` |
| `apps/server/src/modules/admin/admin.service.ts` | 修改 | 使用 `RedisService.keys()` 和 `RedisService.ping()` |
| `apps/server/src/modules/customer-auth/customer-token.service.ts` | 修改 | 使用集合能力封装，移除底层客户端调用 |
| `apps/server/src/health/tests/health.service.spec.ts` | 修改 | 更新 Redis mock |
| `apps/server/src/modules/admin/tests/admin.service.spec.ts` | 修改 | 更新 Redis mock |
| `apps/server/src/modules/customer-auth/tests/customer-token.service.spec.ts` | 修改 | 更新 Redis mock 和断言 |

## 影响范围

| 范围 | 是否影响 | 说明 |
|---|---|---|
| 后端接口 | 否 | Redis 对外业务行为保持不变 |
| 管理端页面 | 否 | 在线用户和相关接口的调用结果不变 |
| 用户端页面 | 否 | refresh token 行为保持不变 |
| 数据库 / Prisma | 否 | 未修改 Prisma schema 或数据库结构 |
| Redis 数据格式 | 否 | 未修改键名、值格式或 TTL 数值 |
| 测试 | 是 | Redis mock 从底层客户端结构改为 RedisService 能力结构 |
| 构建 / 部署 | 否 | 未修改部署配置和环境变量 |
| 文档 | 是 | 新增本工程变更报告和学习复盘报告 |

## 验证结果

| 验证项 | 命令 / 方式 | 结果 | 说明 |
|---|---|---|---|
| 残留调用检查 | `rg "getClient\(\)" apps/server/src` | 通过 | 生产代码无残留结果 |
| 空白检查 | `git diff --check -- <涉及文件>` | 通过 | 无空白错误 |
| Redis 相关单元测试 | `pnpm --filter @elm-platform/server run test -- --runInBand ...` | 通过 | 3 个测试套件、12 个测试全部通过 |
| 后端构建 | `pnpm --filter @elm-platform/server run build` | 通过 | `nest build` 成功 |
| ESLint | `pnpm --filter @elm-platform/server exec eslint ...` | 通过（有既有警告） | 无错误；存在项目原有 `any` 警告 |

## 风险与回滚

### 潜在风险

- `RedisService` 新增的方法目前是对 `ioredis` 命令的薄封装，尚未增加统一的错误转换或重试策略。
- `keys()` 仍然使用 Redis 的 `KEYS` 命令。当前在线用户数据规模有限时可以接受；如果生产键数量很大，应考虑改成 `SCAN` 封装。
- `set()` 现在会对所有显式传入的 TTL 调用 `EX`，调用方需要继续保证 TTL 是正整数。

### 兼容性影响

- Redis 键名、值序列化方式、集合成员格式和过期时间没有改变。
- 业务服务的公开接口没有改变。
- 测试依赖结构发生改变：测试 mock 需要模拟 RedisService 方法，而不是 `getClient()`。

### 回滚方式

如果需要回滚本次改动，可以恢复以下文件：

```text
apps/server/src/redis/redis.service.ts
apps/server/src/health/health.service.ts
apps/server/src/health/tests/health.service.spec.ts
apps/server/src/modules/admin/admin.service.ts
apps/server/src/modules/admin/tests/admin.service.spec.ts
apps/server/src/modules/customer-auth/customer-token.service.ts
apps/server/src/modules/customer-auth/tests/customer-token.service.spec.ts
```

回滚时必须同时恢复生产代码和测试 mock，否则测试会继续按照新的 RedisService API 运行而失败。

## 后续事项

1. 继续将其他可能直接依赖 Prisma 或 Redis 具体客户端的边界逐步收紧。
2. 如果在线用户键数量增长，评估为 `RedisService.scan()` 增加基于 `SCAN` 的实现。
3. 如果未来迁移到 `node-redis`，优先只修改 `apps/server/src/redis/redis.service.ts`，然后运行完整后端测试。
4. 可为 RedisService 单独增加单元测试，覆盖 JSON 序列化、TTL、集合方法和 Redis 错误传播行为。

---

**修改日期**：2026/09/04  
**分支**：`codex/web-admin-vite-plugin-mock`

---
date: 2026-09-04
type: 学习复盘
tech: [NestJS, TypeScript, Redis, ioredis]
change: 2026-09-04-RedisService封装
---

# 学习复盘报告：为什么要减少 RedisService 的 getClient() 暴露

## 问题现象 / 需求来源

项目中已经存在 `RedisService`，业务服务也通过依赖注入使用它，但部分代码仍然绕过封装直接获取底层 `ioredis` 客户端：

```ts
const client = this.redis.getClient()
const keys = await client.keys('admin:online:*')
```

或者：

```ts
await this.redis.getClient().srem(key, tokenId)
```

这类代码短期内能够工作，但会导致业务层依赖 `ioredis` 的具体 API。此前讨论 `ioredis` 是否迁移到 `node-redis` 时，这个问题更加明显：如果业务层直接使用 `srem`、`smembers` 等命令，那么迁移客户端时，业务代码也必须跟着修改。

## 问题产生原因

### 直接原因

`RedisService` 暴露了：

```ts
getClient(): Redis {
  return this.client
}
```

这个方法把基础设施实现泄露给了所有调用方。调用方自然会直接使用底层客户端支持的命令。

### 深层原因

最初的封装只覆盖了少量通用方法：

```ts
set()
get()
getObject()
del()
exists()
expire()
incr()
```

当业务需要 `keys`、`ping`、Set 操作时，没有对应的 RedisService 方法，于是通过 `getClient()` 绕过封装。这说明：

> 抽象层如果没有覆盖真实业务需要的最小能力，调用方就会重新建立一条绕过抽象层的路径。

### 触发条件

以下场景容易产生这种问题：

- 新业务需要 Redis 尚未封装的命令；
- 开发者为了少写一个包装方法直接调用客户端；
- 测试 mock 按底层客户端结构编写；
- 计划更换 Redis 客户端时发现业务代码散落着具体客户端 API。

## 为什么要这样修改

### 方案比较

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 在 RedisService 中增加最小能力方法，并删除 getClient | 是 | 从 API 层面收紧边界，迁移范围清晰，避免业务层继续耦合 ioredis |
| 保留 getClient，只通过代码规范禁止调用 | 否 | 只能依赖人工自觉，类型和接口仍然允许误用 |
| 把所有 Redis 命令都包装一遍 | 否 | 过度设计；当前项目只需要少量命令，全部包装会增加维护负担 |
| 立即迁移 node-redis | 否 | 当前没有必须迁移的功能需求；先完成客户端无关的业务边界更稳妥 |

### 当前方案的判断依据

当前业务真正需要的 Redis 能力很有限：

```text
键查询、连通性探测、Set 增加、Set 删除、Set 读取
```

因此只增加：

```ts
keys()
ping()
addToSet()
removeFromSet()
getSetMembers()
```

这是一种“按能力建模”的最小封装，而不是把 `ioredis` 的全部 API 复制到 `RedisService`。

## 这样修改解决了什么问题

### 1. 业务层不再依赖具体 Redis 客户端

修改后，业务层使用：

```ts
await this.redis.addToSet(userKey, tokenId)
await this.redis.removeFromSet(userKey, tokenId)
const tokenIds = await this.redis.getSetMembers(userKey)
```

业务表达的是“向集合增加成员”“从集合移除成员”“读取集合成员”，而不是直接表达 `ioredis` 的 `sadd`、`srem`、`smembers` 命令。

### 2. 未来迁移客户端时修改范围更小

如果未来使用 `node-redis`，底层可能从：

```ts
this.client.sadd(key, ...members)
```

变成：

```ts
this.client.sAdd(key, members)
```

业务层不需要知道这个差异，因为差异被限制在 `RedisService` 内部。

### 3. 测试更接近业务依赖

修改前测试需要构造嵌套 client：

```ts
const redis = {
  getClient: jest.fn().mockReturnValue({
    ping: jest.fn().mockResolvedValue('PONG'),
  }),
}
```

修改后直接构造 RedisService 能力 mock：

```ts
const redis = {
  ping: jest.fn().mockResolvedValue('PONG'),
}
```

测试不再关心 RedisService 内部是否使用 `ioredis`、是否通过某个 client 属性执行命令。

## 修改前后对比

### 修改前：暴露底层客户端

```ts
getClient(): Redis {
  return this.client
}
```

业务服务：

```ts
const client = this.redis.getClient()
const keys = await client.keys('admin:online:*')
```

问题：

- 业务层知道 `Redis` 这个具体类型；
- `keys()` 的底层实现可以被任意调用；
- 后续客户端迁移会影响业务服务；
- mock 需要模拟底层客户端对象。

### 修改后：只暴露 Redis 能力

```ts
async keys(pattern: string): Promise<string[]> {
  return this.client.keys(pattern)
}

async ping(): Promise<string> {
  return this.client.ping()
}
```

业务服务：

```ts
const keys = await this.redis.keys('admin:online:*')
const pong = await this.redis.ping()
```

改善点：

- 业务服务只依赖 RedisService；
- 底层 `ioredis` 类型不再向外传播；
- API 迁移集中在 RedisService；
- 测试可以直接 mock 需要的能力。

这些方法解决的是当前项目的客户端耦合问题，但没有自动解决 Redis 连接生命周期、重试策略、并发一致性或大规模键扫描问题。

## TTL 判断的额外修正

原代码：

```ts
if (ttl) {
  await this.client.set(key, val, 'EX', ttl)
}
```

这里使用 truthy 判断。`undefined`、`0`、`NaN` 等值会被混在一起处理。

修改后：

```ts
if (ttl !== undefined) {
  await this.client.set(key, val, 'EX', ttl)
}
```

这段代码只解决“是否传入 TTL”的判断问题。它并不负责验证 TTL 是否为正整数；如果项目希望阻止 `0`、负数或小数 TTL，应该再增加显式校验，而不是认为 `ttl !== undefined` 已经完成了全部校验。

## 涉及文件

| 文件 | 作用 | 为什么涉及它 |
|---|---|---|
| `apps/server/src/redis/redis.service.ts` | Redis 基础设施封装 | 增加能力方法并删除 `getClient()` |
| `apps/server/src/health/health.service.ts` | 后端健康检查 | 使用 `RedisService.ping()` |
| `apps/server/src/modules/admin/admin.service.ts` | 在线用户和系统运行态日志 | 使用 `RedisService.keys()`、`ping()` |
| `apps/server/src/modules/customer-auth/customer-token.service.ts` | Customer refresh token 管理 | 使用 Set 能力方法替代底层客户端调用 |
| `apps/server/src/health/tests/health.service.spec.ts` | 健康检查测试 | 更新 Redis mock |
| `apps/server/src/modules/admin/tests/admin.service.spec.ts` | 管理服务测试 | 更新 Redis mock |
| `apps/server/src/modules/customer-auth/tests/customer-token.service.spec.ts` | refresh token 测试 | 更新集合操作 mock 和断言 |

## 验证方式

| 验证项 | 命令 / 方式 | 结果 | 说明 |
|---|---|---|---|
| 查找生产残留调用 | `rg "getClient\(\)" apps/server/src` | 通过 | 没有生产代码残留 |
| 构建 | `pnpm --filter @elm-platform/server run build` | 通过 | `nest build` 成功 |
| Redis 相关测试 | `pnpm --filter @elm-platform/server run test -- --runInBand src/modules/customer-auth/tests/customer-token.service.spec.ts src/modules/admin/tests/admin.service.spec.ts src/health/tests/health.service.spec.ts` | 通过 | 3 个测试套件、12 个测试全部通过 |
| ESLint | `pnpm --filter @elm-platform/server exec eslint ...` | 通过（有警告） | 无错误；存在项目其他位置的既有 `any` 警告 |
| Git 空白检查 | `git diff --check -- <涉及文件>` | 通过 | 无空白错误 |

## 学习要点

1. **封装不是简单转发，而是边界设计。** `RedisService.keys()` 仍然调用底层 `client.keys()`，但调用方不再拥有客户端对象，依赖方向被固定下来。
2. **按业务能力封装比按第三方 API 复制更稳定。** `addToSet()` 描述的是集合能力，未来可以在内部适配 `sadd`、`sAdd` 或其他实现。
3. **删除逃生舱口比增加规范更可靠。** 保留 `getClient()` 并要求“不要调用”只能依靠约定；删除它才能让错误依赖在编译阶段暴露。
4. **测试应该 mock 被测对象的依赖接口。** CustomerTokenService 依赖的是 RedisService 方法，而不是 ioredis client，因此测试也应该直接 mock RedisService 方法。
5. **`KEYS` 和 `SCAN` 不是同一个概念。** 当前仍保留 `keys()`，因为在线用户键规模有限；如果生产键空间变大，应增加 `scan()`，避免 `KEYS` 对 Redis 造成阻塞。

## 注意事项与边界

### 1. 不要为了消除 getClient() 而包装所有 Redis API

如果每个 Redis 命令都机械地加一个同名方法，RedisService 只是换了一个名字的客户端，抽象价值仍然有限。应当根据业务实际需要设计能力方法。

### 2. `keys()` 当前仍有规模风险

当前代码使用：

```ts
await this.redis.keys('admin:online:*')
```

Redis 的 `KEYS` 适合小规模、管理性质的键查询，不适合大型生产键空间。后续应考虑封装异步迭代的 `SCAN`，并在 AdminService 中使用分页或流式处理。

### 3. Set 操作与过期时间不是一个原子操作

Customer refresh token 创建时先写 token，再执行：

```ts
await this.redis.addToSet(userKey, tokenId)
await this.redis.expire(userKey, CUSTOMER_REFRESH_TOKEN_TTL_SECONDS)
```

如果中间发生故障，可能出现 token 已写入但集合未更新，或集合更新但过期时间未设置。当前场景可以接受，但如果需要更强的一致性，应考虑 Pipeline 或 Lua Script，并把这些能力继续封装在 RedisService 内，而不是重新暴露 `getClient()`。

### 4. RedisService 仍然是 ioredis 实现

本次改动没有迁移客户端，只是隔离客户端依赖。因此不能据此断言已经完全实现 `node-redis` 兼容；真正迁移时仍需要在 RedisService 内调整连接创建、命令 API、关闭方式和测试。

## 以后如何避免

- 新增 Redis 操作前，先检查 RedisService 是否已经提供对应的能力方法。
- 如果没有，优先在 RedisService 增加最小方法，不要恢复 `getClient()`。
- 业务服务和测试都不要 import `ioredis` 类型。
- 对键扫描、事务、Pipeline、Lua 等复杂能力，也要先定义 RedisService 层面的接口。
- 新增方法时至少补充一个成功场景和一个 Redis 异常场景测试。
- 定期搜索：

```bash
rg "from ['\"]ioredis['\"]|getClient\(\)" apps/server/src
```

如果生产代码出现匹配，应评估是否重新发生了客户端泄露。

## 关联报告

- 工程变更报告：`./engineering-change-report.md`

---

**复盘日期**：2026/09/04  
**分支**：`codex/web-admin-vite-plugin-mock`

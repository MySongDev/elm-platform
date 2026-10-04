# 教学型注释规范

> **地位**：本仓库所有 AI 工具与人类贡献者的**默认注释契约**，由根目录 `CLAUDE.md` / `AGENTS.md` 引用。
> **来源**：2026-10-04 落地。起因是 TabBar 注释补写时发现 AI 会把注释写成代码翻译，并**编造浏览器与第三方库的机制**。

---

## 1. 唯一判据

> **删掉这条注释，未来要改这里的人会不会做出错误决策？**

| 删掉后的后果 | 处理 |
|---|---|
| 会改错，且**静默改错**（不报错、只是行为变了） | 必留，且要写到能验证 |
| 只是少知道背景，但不会改错 | 酌情；有人真会问才留 |
| 完全无损失，甚至更清爽 | 删 |

低价值注释有**负收益**：稀释注意力、误导后来者「这里有讲究」、诱导后续继续在附近加注释。

## 2. 硬约束（违反即错，与技巧无关）

1. **不许编造机制。** 禁止编造浏览器行为、Vue 内部机制、第三方库行为，或用「感觉」解释代码。
2. **不确定就只写代码能证明的行为。** 宁可少写一句，不可写错一句。**错注释比没注释更有害**——它会让人照着错的因果做决策。
3. **不得为了迁就旧注释而保留错误实现。** 改代码时发现注释与实现不符：正确的改、错误的删、过时的更新、重复的合并。
4. **不写代码翻译。** `// 阻止默认事件` 是把 `preventDefault()` 念了一遍；正确写法是 `// WHY: 否则原生右键菜单和自定义菜单会同时出现`。

> 标签体系（WHY / ORDER / RACE / BOUNDARY / LIFECYCLE / TRADE-OFF / PERF / SECURITY）**只能当检查清单，绝不能当注释格式**。一旦要求「给这行贴个标签」，就会给不值得解释的行分配标签。

## 3. 该写的五类位置

其余保持沉默。**每行都注释等于没注释。**

| 位置 | 写什么 |
|---|---|
| **函数头** | 意图 / 调用方 / 输入输出 / 副作用 / 时序 / 竞态 / WHAT IF（删掉会怎样） |
| **状态变量** | 存在意义 / 谁改它 / 为什么不用别的方案 / 删了会怎样 |
| **异步回调** | 顺序依赖 / 为什么不能同步 / 过期结果如何被丢弃 |
| **兜底分支** | 为什么需要 fallback，什么时候真的会走到 |
| **注册/注销** | 何时激活关闭 / 为什么延后 / 漏了会怎样 |

行内注释只写 **WHY**，不写 WHAT。

## 4. 示例（全部来自本仓库，均已验证）

**① 静默失效点——两个兄弟 handler 为何不一致**

`ui/TabBarContextMenu.vue` 的 `handleCommand` 要自己判 `disabled`，`ui/TabBarActions.vue` 的同名函数不用：

```ts
/**
 * WHY 这里必须自己判 disabled，而 TabBarActions.handleCommand 不用：
 *   el-dropdown-item 内部在 handleClick 里 `if (props.disabled) { e.stopImmediatePropagation(); return }`，
 *   disabled 项根本不会 emit command；而这里是裸 <ul><li>，没有原生 disabled，@click 一定会冒上来。
 * WHAT IF: 删掉这个 if → 点灰项照常执行，会真的关掉固定 tab / 批量关闭越界的 tab。
 */
```

**② 静默失效点——名字契约**

`widgets/admin-layout/ui/MainContent/index.vue:13` 的 `keep-alive :include="tabsStore.cachedViews"` 匹配的是**组件自身的 `name`**。页面 `defineOptions({ name })` 与后端菜单 `name` 不一致时，多页签缓存**静默失效**、不报错。当前 `system/*` 与 `monitor/*` 四个页面就是坏的。

**③ 竞态——为什么是普通变量而不是 ref**

`useMenu.ts` 的 `dismissSessionToken` 只需要「值对不对得上」的同步比对，不需要响应式追踪；用 `let` 避免每次 open/close 多一次 reactive 通知。删掉它 → 快速开-关-开连环时，旧 `nextTick` 回调会用旧坐标覆盖新菜单。

**④ 生命周期——为什么 DOM 所有权在视图层**

`useScrollManager` 不创建 template ref，由视图层 `useTemplateRef` 传入。本文件管行为与监听生命周期，不管模板长什么样；ref 由视图层绑定，逻辑才能复用到结构不同的 TabBar。

**⑤ 顺序依赖——后端 guard 的顺序不是风格问题**

`apps/server/src/modules/user/user.controller.ts:31` 写的是 `@UseGuards(AdminAuthGuard, RolesGuard)`。`AdminAuthGuard`（`guards/admin-auth.guard.ts:7`）先把 JWT 解析结果挂到 `request.user`，`RolesGuard`（`guards/roles.guard.ts:32`）才去读 `request.user?.id` 拿权限。

```ts
/**
 * WHY RolesGuard 必须排在 AdminAuthGuard 之后：
 *   RolesGuard 直接读 request.user?.id，取不到就 return false。
 *   顺序颠倒 → 所有带 @RequireRoles / @RequirePermissions 的接口一律 403，
 *   而且不抛异常、不打日志，只表现为"权限注解突然全失效"。
 * WHAT IF: 删掉守卫顺序的自觉 → 新人按字母序排列 @UseGuards，全站权限静默崩掉。
 */
```

**⑥ 元数据覆盖——`getAllAndOverride` 的合并方向**

`roles.guard.ts:16` 用 `getAllAndOverride([handler, class])`：方法级注解**覆盖**类级注解，而不是合并。类上写 `@RequireRoles('admin')`、方法上写 `@RequirePermissions('x')` 时，角色要求会被方法级整个替换掉，不是两个都要求。

**⑦ 兜底分支——后端"成功"有两种形状**

`apps/server/src/common/interceptors/transform.interceptor.ts:42`：普通返回值会被包成 `{ code: 200, data, message, timestamp }`，但 `rawResponse(payload)` 会**原样穿透**，不包 `code`。前端 `apps/web-admin/src/shared/api/http.ts:87` 的响应拦截器正是按 `body.code !== 200` 判失败——所以任何想跳过后端包装的接口都必须返回 `rawResponse()`，否则前端的 `code !== 200` 判定会看到 `undefined`，走进失败分支。

```ts
/**
 * WHY 需要 rawResponse 这个逃生口：
 *   前端 http.ts 的响应拦截器按 body.code !== 200 判失败，
 *   而普通返回值会被自动包上 code: 200。
 *   所以想让某个接口原样返回自己的结构（比如文件流、第三方回调体），
 *   必须走 rawResponse()，否则前端会把它当成失败响应。
 * WHAT IF: 删掉这个分支 → 新增一个需要自定义响应结构的接口时，
 *   前端拿到 undefined code，弹"请求失败"但后端日志显示 200，极难排查。
 */
```

**⑧ 竞态——用"先移除、下一帧再插回"实现强制重挂**

`apps/web-admin/src/entities/tab/model/store.ts:142` 的 `reloadTab`：Vue 在 patch 时比较 `isSameVNodeType(n1, n2)`（判据是 `n1.type === n2.type && n1.key === n2.key`），key 相同就只走 update、不重新挂载。所以"刷新当前页签"不能靠改数据，必须先 `splice` 移除、等 `nextTick` 再插回——让中间那一帧列表里没有它，强制 key 变化触发重挂载。

```ts
/**
 * WHY 要先移除再插回，而不是直接改数据：
 *   Vue patch 时 isSameVNodeType 只比较 type 和 key，两者相同就只 update 不重挂载，
 *   组件状态（滚动位置、表单内容）会被保留下来，达不到"刷新"效果。
 *   移除后下一帧插回，中间那帧 key 消失 → 强制重挂载，状态才真的清空。
 * WHY 用 nextTick 而不是同步插回：
 *   同步插回时列表在该次 patch 里从未真正少过这一项，key 没变过，Vue 不会重挂。
 * WHAT IF: 删掉这个 nextTick → "刷新页签"按钮点了没反应，也不报错。
 */
```

## 5. 各文件类型的重点（只看最容易静默失效的那一处）

| 类型 | 重点 |
|---|---|
| `.vue` SFC | 组件**不**负责什么；状态属组件还是全局；`defineOptions.name` 与 keep-alive 契约；Teleport / DOM 测量 / 异步更新的时序 |
| composable | 抽象封装了什么变化；状态与副作用各归谁；`setup`/`cleanup` 必须配对 |
| Pinia store | 为什么这个状态必须全局；什么**不该**进 store；持久化与重置时机 |
| router / guard | guard 执行顺序；动态路由重复注册；退出登录后的清理 |
| API / service | 这层管网络还是业务；错误归谁；契约字段的可选性 |
| 后端（controller/service/guard/pipe） | `@UseGuards` 的**顺序即依赖**；DTO 与 domain model 为何分离；Prisma 事务边界 |
| 类型 / schema | `null` 与 `undefined` 的语义差别；哪个字段来自后端、哪个是前端推导 |
| 配置 | 为什么开这个选项；build-time / runtime / CI / local 的边界 |
| 测试 | **测的是业务契约还是实现细节**；为什么这个边界值得测（默认不写测试，见 `AI_TEST_POLICY.md`） |

## 6. 适用范围与范围限定

- 适用于 `.vue` / `.ts` / `.js` / 测试 / 配置，**默认生效，无需在文件内重复声明**。
- **只对本次新增或修改的文件补注释。** 不做全仓普查——本仓库 TS/Vue 约 3.6 万行，全量补注必然注水。
- 改动前先问：**这个文件负责什么、不负责什么、谁调用它、管什么状态、有什么副作用、有无竞态与边界**。只对答不上来的部分写注释。

## 7. 终检（只问删得掉吗）

1. 这条注释删掉，我会不会改错？
2. 里面的因果是**我验证过的**，还是我猜的？
3. 它是在解释机制，还是在念代码？

三条都过才留。
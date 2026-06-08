---
date: 2026-06-08
type: 学习复盘
tech: [pnpm, monorepo, package-json, workspace]
change: 2026-06-08-package-name-normalization
---

# 学习复盘报告：理解 pnpm workspace 包名和 `--filter` 的关系

## 问题现象 / 需求来源

在学习根目录 `package.json` 的 `scripts` 时，看到命令中存在：

```bash
pnpm --filter elm-web-admin run dev
pnpm --filter vue3-elm-js run dev
pnpm --filter vue3-elm-node run start:dev
```

随后产生问题：

> `elm-web-admin` 这个名字是哪来的？

进一步检查后发现，这些名字来自各子项目 `package.json` 的 `name` 字段，而不是目录名本身。由于当前包名风格不统一，因此提出统一命名需求。

## 问题产生原因

直接原因：

- `pnpm --filter <name>` 依赖 workspace package 的 `name` 字段。
- 当前三个应用包名来自历史命名，风格不一致。
- 部分包名带有旧技术栈或旧项目语义，例如 `vue3-elm-node`、`vue3-elm-js`。

深层原因：

- 项目逐步演进为 monorepo 后，应用包和共享包没有一开始统一命名规范。
- 共享包已使用 `@elm-platform/*`，但应用包仍保留旧名称。

触发条件：

- 当根目录 `scripts` 使用 `pnpm --filter` 调度子项目时，包名不一致会增加理解成本。
- 当新人学习项目命令时，不容易从 `vue3-elm-js` 判断它对应 `apps/web-user`。

## 为什么要这样修改

采用 `@elm-platform/*` 的原因：

| 方案 | 是否采用 | 原因 |
|---|---|---|
| `@elm-platform/server`、`@elm-platform/web-admin`、`@elm-platform/web-user` | 是 | 和已有共享包风格统一，能表达项目归属和模块职责 |
| `elm-server`、`elm-web-admin`、`elm-web-user` | 否 | 没有 scope，不如 `@elm-platform/*` 适合 monorepo |
| `vue3-elm-server`、`vue3-elm-admin`、`vue3-elm-user` | 否 | 技术栈命名容易过时，且后端不应包含 `vue3` |

## 这样修改解决了什么问题

修改后解决了：

- 应用包名和共享包命名风格不一致的问题。
- 根目录 scripts 中旧包名不直观的问题。
- `@elm-platform/web-user` 这类名称来源不清晰的问题。
- 后续新增 workspace package 时缺少命名参考的问题。

修改前：

```json
{
  "name": "vue3-elm-js"
}
```

根目录脚本：

```json
"dev:user": "pnpm --filter vue3-elm-js run dev"
```

修改后：

```json
{
  "name": "@elm-platform/web-user"
}
```

根目录脚本：

```json
"dev:user": "pnpm --filter @elm-platform/web-user run dev"
```

## 修改前后对比

### 修改前

```text
apps/server      name = vue3-elm-node
apps/web-admin   name = elm-web-admin
apps/web-user    name = vue3-elm-js
packages/*       name = @elm-platform/...
```

问题：

- 应用包和共享包命名风格不统一。
- `vue3-elm-node` 对后端语义不准确。
- `vue3-elm-js` 不容易看出是用户端 Web 应用。

### 修改后

```text
apps/server      name = @elm-platform/server
apps/web-admin   name = @elm-platform/web-admin
apps/web-user    name = @elm-platform/web-user
packages/*       name = @elm-platform/...
```

效果：

- 所有内部包统一使用 `@elm-platform/*`。
- 包名能说明所属项目和模块职责。
- 根目录 `pnpm --filter` 命令更容易理解。

## `@elm-platform/web-user` 到底是哪来的？

它来自这个文件：

```text
apps/web-user/package.json
```

里面的字段是：

```json
"name": "@elm-platform/web-user"
```

所以根目录写：

```bash
pnpm --filter @elm-platform/web-user run dev
```

不是因为目录名自动变成了 `@elm-platform/web-user`，而是因为 pnpm workspace 会读取每个子项目 `package.json` 的 `name` 字段。

完整链路：

```text
pnpm dev:user
  ↓
根目录 scripts.dev:user
  ↓
pnpm --filter @elm-platform/web-user run dev
  ↓
pnpm 在 workspace 中找到 name = @elm-platform/web-user 的包
  ↓
定位 apps/web-user/package.json
  ↓
执行 apps/web-user/package.json 的 scripts.dev
  ↓
vite --host
```

## 涉及文件

| 文件 | 作用 | 为什么涉及它 |
|---|---|---|
| `apps/server/package.json` | 后端应用 package manifest | 修改 `name` 为 `@elm-platform/server` |
| `apps/web-admin/package.json` | 管理端 package manifest | 修改 `name` 为 `@elm-platform/web-admin` |
| `apps/web-user/package.json` | 用户端 package manifest | 修改 `name` 为 `@elm-platform/web-user` |
| `package.json` | 根目录脚本入口 | 更新 `pnpm --filter` 引用 |
| `.github/workflows/ci.yml` | CI 自动化流程 | 更新 CI 中的 filter 引用 |
| `scripts/run-playwright-e2e.mjs` | E2E 自定义启动脚本 | 更新服务启动 filter |
| `playwright.config.ts` | Playwright 配置 | 更新 webServer 启动命令 |
| `CLAUDE.md`、`AGENTS.md` | 项目协作说明 | 更新命令示例 |
| `docs/reports/2026-06-08-package-name-normalization/engineering-change-report.md` | 工程变更报告 | 记录影响范围、验证和回滚方式 |

## 验证方式

| 验证项 | 命令 / 方式 | 结果 | 说明 |
|---|---|---|---|
| 验证 JSON 可解析 | `node -e "JSON.parse(fs.readFileSync(...))"` | 通过 | 根目录和三个应用 package.json 均可解析 |
| 验证后端 filter | `pnpm --filter "@elm-platform/server" exec node -p "require('./package.json').name"` | 通过 | 输出 `@elm-platform/server` |
| 验证管理端 filter | `pnpm --filter "@elm-platform/web-admin" exec node -p "require('./package.json').name"` | 通过 | 输出 `@elm-platform/web-admin` |
| 验证用户端 filter | `pnpm --filter "@elm-platform/web-user" exec node -p "require('./package.json').name"` | 通过 | 输出 `@elm-platform/web-user` |
| 旧包名残留检查 | 搜索旧包名 | 通过 | 未发现旧包名残留 |

## 学习要点

1. **`package.json` 的 `name` 是 workspace 包名** — pnpm workspace 会根据每个子项目的 `name` 字段识别包。
2. **`pnpm --filter` 通常筛选的是包名，不是目录名** — `@elm-platform/web-user` 能生效，是因为 `apps/web-user/package.json` 里声明了这个 name。
3. **scope 命名适合 monorepo** — `@elm-platform/server` 比 `vue3-elm-node` 更能表达项目归属和模块职责。
4. **改包名必须同步改引用** — 根目录 scripts、CI、E2E 脚本、文档中的 `--filter` 都要同步更新。
5. **避免把技术栈写死在长期包名里** — `vue3`、`node` 这类词可能随着项目演进变得不准确。

## 以后如何避免

- 新增 workspace package 时统一使用 `@elm-platform/<module>`。
- 包名应该表达职责，而不是只表达技术栈。
- 修改 `package.json` 的 `name` 后，必须搜索并更新所有 `pnpm --filter` 引用。
- 命名迁移后至少验证：

```bash
pnpm --filter "@elm-platform/<module>" exec node -p "require('./package.json').name"
```

## 关联报告

- 工程变更报告：`./engineering-change-report.md`

---

**复盘日期**：2026/06/08  
**分支**：`refactor/monorepo-shared-packages`

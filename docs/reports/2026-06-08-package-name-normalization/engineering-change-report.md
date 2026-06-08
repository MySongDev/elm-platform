---
date: 2026-06-08
type: 工程变更
tech: [pnpm, monorepo, package-json, workspace]
change: 2026-06-08-package-name-normalization
---

# 工程变更报告：统一 monorepo 包名为 `@elm-platform/*`

## 变更背景

当前项目是 pnpm workspace monorepo，包含后端、管理端、用户端和共享包。根目录通过 `pnpm --filter <package-name>` 调度各子项目脚本，因此每个子项目 `package.json` 的 `name` 字段会直接影响开发命令、CI、E2E 启动脚本和文档说明。

原有命名存在历史遗留和风格不一致问题：

| 目录 | 原包名 | 问题 |
|---|---|---|
| `apps/server` | `vue3-elm-node` | 后端项目包含 `vue3`，语义不准确 |
| `apps/web-admin` | `elm-web-admin` | 可读性尚可，但没有与共享包一致的 scope |
| `apps/web-user` | `vue3-elm-js` | 像旧项目名，不直观，也没有说明它是用户端 Web 应用 |

项目中已有共享包使用 `@elm-platform/*` 风格，例如 `@elm-platform/contracts`、`@elm-platform/api-types`、`@elm-platform/tsconfig`、`@elm-platform/vite-config`。因此本次改动将应用包名统一到相同命名体系。

## 变更目标

- 将应用包名统一为 `@elm-platform/*` 风格。
- 让根目录 `scripts`、CI、Playwright/E2E 脚本和文档中的 `pnpm --filter` 引用保持一致。
- 明确说明根目录中 `@elm-platform/web-user` 的由来，降低后续学习和维护成本。
- 不改动应用目录结构，不改动业务代码逻辑，不调整运行端口或构建流程。

## 修改方案

| 方案 | 是否采用 | 原因 |
|---|---|---|
| 使用 `@elm-platform/server`、`@elm-platform/web-admin`、`@elm-platform/web-user` | 是 | 与已有共享包 `@elm-platform/*` 统一，包名能表达项目归属和模块职责 |
| 使用 `elm-server`、`elm-web-admin`、`elm-web-user` | 否 | 没有 scope，和已有共享包命名体系不一致 |
| 使用 `vue3-elm-server`、`vue3-elm-admin`、`vue3-elm-user` | 否 | 把技术栈写进包名，后端也包含 `vue3`，语义容易过时 |

## 修改内容

### 1. `apps/server/package.json` — 后端包名改为 `@elm-platform/server`

```diff
- "name": "vue3-elm-node"
+ "name": "@elm-platform/server"
```

说明：

- `@elm-platform` 表示该包属于 Elm Platform monorepo。
- `server` 表示这是后端服务应用。
- 修改后根目录可以通过 `pnpm --filter @elm-platform/server ...` 定位该包。

### 2. `apps/web-admin/package.json` — 管理端包名改为 `@elm-platform/web-admin`

```diff
- "name": "elm-web-admin"
+ "name": "@elm-platform/web-admin"
```

说明：

- `web-admin` 表示这是管理后台 Web 应用。
- 与 `@elm-platform/contracts`、`@elm-platform/api-types` 等共享包保持统一 scope。

### 3. `apps/web-user/package.json` — 用户端包名改为 `@elm-platform/web-user`

```diff
- "name": "vue3-elm-js"
+ "name": "@elm-platform/web-user"
```

说明：

- `web-user` 表示这是用户端 Web 应用。
- 原名 `vue3-elm-js` 更像历史项目名，不能清晰表达“用户端”职责。

### 4. `package.json` — 更新根目录脚本中的 `--filter`

```diff
- pnpm --filter vue3-elm-node ...
- pnpm --filter elm-web-admin ...
- pnpm --filter vue3-elm-js ...
+ pnpm --filter @elm-platform/server ...
+ pnpm --filter @elm-platform/web-admin ...
+ pnpm --filter @elm-platform/web-user ...
```

说明：

- 根目录脚本通过 pnpm workspace 的包名筛选子项目。
- 子项目 `name` 改名后，根目录 `--filter` 必须同步更新，否则命令无法定位对应 workspace package。

### 5. `.github/workflows/ci.yml` — 更新 CI 中的 package filter

CI 中涉及以下任务：

- Prisma Client 生成
- 前端类型检查
- 后端/前端测试
- 后端/前端构建
- API drift 检测中的迁移和服务启动

全部从旧包名更新为新包名，确保远端 CI 使用新的 workspace package 名称。

### 6. `scripts/run-playwright-e2e.mjs` 与 `playwright.config.ts` — 更新 E2E 启动命令

E2E 启动脚本需要分别启动：

| 服务 | 新 filter |
|---|---|
| 后端 | `@elm-platform/server` |
| 管理端 | `@elm-platform/web-admin` |
| 用户端 | `@elm-platform/web-user` |

因此同步更新 Playwright web server 和自定义 E2E runner 中的命令。

### 7. `CLAUDE.md`、`AGENTS.md` 等文档 — 更新命令示例

把文档中的旧命令：

```bash
pnpm --filter vue3-elm-node run start:dev
pnpm --filter elm-web-admin run dev
pnpm --filter vue3-elm-js run dev
```

更新为：

```bash
pnpm --filter @elm-platform/server run start:dev
pnpm --filter @elm-platform/web-admin run dev
pnpm --filter @elm-platform/web-user run dev
```

## 根目录中 `@elm-platform/web-user` 的由来

根目录 `package.json` 中的命令：

```json
"dev:user": "pnpm --filter @elm-platform/web-user run dev"
```

这里的 `@elm-platform/web-user` 来自：

```text
apps/web-user/package.json
```

其中声明了：

```json
"name": "@elm-platform/web-user"
```

pnpm workspace 的 `--filter` 不是随便写的字符串，它会根据 workspace 中各子项目 `package.json` 的 `name` 字段定位包。因此：

```bash
pnpm --filter @elm-platform/web-user run dev
```

含义是：

```text
在 pnpm workspace 中找到 name 为 @elm-platform/web-user 的包，
也就是 apps/web-user，
然后执行它自己的 scripts.dev。
```

对应执行链路是：

```text
根目录 pnpm dev:user
  ↓
pnpm --filter @elm-platform/web-user run dev
  ↓
定位 apps/web-user/package.json
  ↓
执行 apps/web-user 的 scripts.dev
  ↓
vite --host
```

所以 `@elm-platform/web-user` 的来源不是目录名直接生成的，也不是 pnpm 自动起的名字，而是 `apps/web-user/package.json` 里显式声明的包名。

## 涉及文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `apps/server/package.json` | 修改 | 后端包名改为 `@elm-platform/server` |
| `apps/web-admin/package.json` | 修改 | 管理端包名改为 `@elm-platform/web-admin` |
| `apps/web-user/package.json` | 修改 | 用户端包名改为 `@elm-platform/web-user` |
| `package.json` | 修改 | 根目录 scripts 使用新的 scoped package filter |
| `.github/workflows/ci.yml` | 修改 | CI 中所有应用包 filter 同步改名 |
| `scripts/run-playwright-e2e.mjs` | 修改 | E2E 自定义启动脚本使用新包名 |
| `playwright.config.ts` | 修改 | Playwright webServer 启动命令使用新包名 |
| `CLAUDE.md` | 修改 | 更新 Claude Code 项目说明中的命令示例 |
| `AGENTS.md` | 修改 | 更新 Codex 项目说明中的命令示例 |
| 其他说明文档 | 修改 | 将旧包名引用替换为新包名，保持文档一致 |

## 影响范围

| 范围 | 是否影响 | 说明 |
|---|---|---|
| 后端接口 | 否 | 仅修改包名和脚本引用，不改接口逻辑 |
| 管理端页面 | 否 | 仅修改包名和脚本引用，不改页面逻辑 |
| 用户端页面 | 否 | 仅修改包名和脚本引用，不改页面逻辑 |
| 数据库 / Prisma | 否 | Prisma schema 和迁移不受包名影响 |
| 测试 | 是 | 测试命令中的 `--filter` 需要使用新包名 |
| 构建 / 部署 | 是 | CI 和根目录 build 脚本需要使用新包名 |
| 文档 | 是 | 命令示例同步更新 |

## 验证结果

| 验证项 | 命令 / 方式 | 结果 | 说明 |
|---|---|---|---|
| JSON 解析 | `node -e "JSON.parse(fs.readFileSync(...))"` | 通过 | 根目录和三个应用 `package.json` 均可解析 |
| pnpm filter 定位后端 | `pnpm --filter "@elm-platform/server" exec node -p "require('./package.json').name"` | 通过 | 输出 `@elm-platform/server` |
| pnpm filter 定位管理端 | `pnpm --filter "@elm-platform/web-admin" exec node -p "require('./package.json').name"` | 通过 | 输出 `@elm-platform/web-admin` |
| pnpm filter 定位用户端 | `pnpm --filter "@elm-platform/web-user" exec node -p "require('./package.json').name"` | 通过 | 输出 `@elm-platform/web-user` |
| 旧包名残留检查 | 搜索 `vue3-elm-node|elm-web-admin|vue3-elm-js` | 通过 | 工作区源码和文档中未发现旧包名残留 |
| 完整测试 / 构建 | 未运行 | 未运行 | 本次是命名和脚本引用迁移，未执行完整测试矩阵 |

## 风险与回滚

- 潜在风险：如果某些外部脚本、个人本地脚本或未纳入仓库的 CI 配置仍使用旧包名，会在执行 `pnpm --filter <旧包名>` 时报找不到包。
- 兼容性影响：`pnpm --filter vue3-elm-node`、`pnpm --filter elm-web-admin`、`pnpm --filter vue3-elm-js` 不再是推荐命令。
- 回滚方式：将三个应用 `package.json` 的 `name` 字段改回旧名，并把根目录 scripts、CI、E2E 脚本和文档中的 `--filter` 同步改回旧包名。

## 后续事项

- 后续新增 `packages/*` 时继续使用 `@elm-platform/<module>` 命名。
- 建议团队统一使用根目录命令，例如 `pnpm dev:user`，避免记忆具体旧包名。
- 如需进一步治理，可在文档中增加“workspace package 命名规范”章节。

---

**修改日期**：2026/06/08  
**分支**：`refactor/monorepo-shared-packages`

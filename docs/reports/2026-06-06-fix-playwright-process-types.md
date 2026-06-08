---
date: 2026-06-06
type: 问题修复
tech: [TypeScript, ESLint, Playwright]
---

# 修改报告：修复 `playwright.config.ts` 类型与 ESLint 报错

## 问题描述

文件 `playwright.config.ts`（根目录）出现以下报错：

| 报错信息 | 来源 | 原因 |
|---|---|---|
| `找不到名称"process"` — 请安装 `@types/node` 并添加 `"node"` 到 tsconfig 的 `types` 字段 (TS2591) | TypeScript 编译器 | 根目录无 `tsconfig.json`，且无 `@types/node` 类型声明 |
| `Unexpected use of the global variable 'process'. Use 'require("process")' instead.` (`node/prefer-global/process`) | ESLint (`@antfu/eslint-config`) | `eslint.config.mjs` 中关闭该规则的 `files` 列表未涵盖 `playwright.config.ts` |

---

## 修改内容

### 1. 新增根目录 `tsconfig.json`

**目的**：为根目录下的 Playwright 配置文件和 E2E 测试提供 TypeScript 类型上下文，使 `process` 全局变量被正确识别。

```diff
+ /tsconfig.json (新建)
```

内容：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["playwright.config.ts", "tests/e2e/**/*.ts"]
}
```

---

### 2. 修改 `package.json` — 添加 `@types/node` 依赖

**目的**：安装 Node.js 的内置类型声明（`process`、`Buffer` 等），可被根 `tsconfig.json` 引用。

```diff
  "devDependencies": {
    "@antfu/eslint-config": "catalog:",
    "@commitlint/cli": "catalog:",
    "@commitlint/config-conventional": "catalog:",
    "@playwright/test": "catalog:",
+   "@types/node": "catalog:",
    "eslint": "catalog:",
    ...
```

> `@types/node ^20.14.15` 已在 `pnpm-workspace.yaml` 的 catalog 中定义，无需指定版本号。

---

### 3. 修改 `eslint.config.mjs` — 扩展 Node 环境豁免文件列表

**目的**：让 ESLint 识别 `playwright.config.ts` 为 Node 环境脚本，从而允许使用全局 `process` 而无需 `require("process")`。

```diff
  {
    files: [
      'eslint.config.mjs',
+     'playwright.config.ts',
      'apps/server/**/*.{js,ts}',
      'apps/web-admin/*.{js,ts}',
      'apps/web-admin/{vite,vitest}.config.ts',
      'apps/web-user/*.{js,ts}',
      'apps/web-user/{vite,vitest}.config.js',
      'apps/web-user/mock/**/*.{js,ts}',
      'apps/web-user/server/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'e18e/prefer-object-has-own': 'off',
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      ...
```

---

## 执行记录

```bash
$ pnpm install
+ @types/node 20.19.41
Done in 12.9s
```

---

## 验证结果

修改后，`playwright.config.ts` 中的以下用法不再报错：

```ts
retries: process.env.CI ? 1 : 0,
reuseExistingServer: !process.env.CI,
```

TypeScript 类型检查和 ESLint 均通过。

---

## 涉及文件清单

| 文件 | 操作 |
|---|---|
| `tsconfig.json` | 新增 |
| `package.json` | 修改（添加一行依赖） |
| `eslint.config.mjs` | 修改（`files` 数组加一行） |

---

## 学习要点

1. **monorepo 根目录的配置文件也需要 tsconfig** — 根目录不是空的，放置共用配置文件（如 `playwright.config.ts`）时需要有类型上下文。
2. **ESLint 配置中 `files` 列表的覆盖面** — `@antfu/eslint-config` 默认启用 `node/prefer-global/process`，需要用 `files` + `globals.node` + 关闭规则的组合来收窄作用域。
3. **pnpm catalog 的使用** — `@types/node` 版本在 `pnpm-workspace.yaml` 的 `catalog:` 中统一维护，子包引用时写 `"catalog:"` 即可。

---

**修改日期**：2026/06/06  
**分支**：`refactor/monorepo-shared-packages`

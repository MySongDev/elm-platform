---
date: 2026-06-06
type: 工程规范
tech: [TypeScript, ESLint, monorepo]
---

# 修改报告：根目录配置文件的 Node 环境类型与 ESLint 规范化

## 问题描述

在修复 `playwright.config.ts` 的 `process` 全局变量报错后，发现同样的模式会重复出现在其他根目录配置文件中：

- `scripts/run-playwright-e2e.mjs`
- 未来可能新增的根目录 `.config.ts` 文件

逐一手动在 `eslint.config.mjs` 和 `tsconfig.json` 中添加路径是不可持续的。

## 根本原因

原配置中 Node 环境覆盖用的是**精确路径列举**：

```js
// ❌ 原写法：每加一个文件就要改配置
files: [
  'eslint.config.mjs',
  'playwright.config.ts',
  // ... 以后还要加更多
]
```

这导致：
1. 新增配置文件时容易遗漏 ESLint 或 tsconfig 的更新
2. 报错出现时才知道缺了什么
3. 维护成本高

## 修改内容

### 1. 修改 `eslint.config.mjs` — 精确路径改为 glob 模式

```diff
  {
    files: [
-     'eslint.config.mjs',
-     'playwright.config.ts',
+     '*.{js,ts,mjs,cjs}',              // 根目录所有脚本文件均为 Node 环境
+     'scripts/**/*.{js,ts,mjs,cjs}',   // scripts 目录下的脚本
      'apps/server/**/*.{js,ts}',
      'apps/web-admin/*.{js,ts}',
 ...
```

**效果**：根目录和 `scripts/` 下所有 `.js`/`.ts`/`.mjs`/`.cjs` 文件自动获得 Node 全局变量豁免，无需逐个添加。

---

### 2. 修改 `tsconfig.json` — `include` 改为模式匹配

```diff
-   "include": ["playwright.config.ts", "tests/e2e/**/*.ts"]
+   "include": ["*.config.ts", "tests/e2e/**/*.ts"]
```

**效果**：根目录所有以 `.config.ts` 结尾的文件自动获得 TypeScript 类型上下文，包括 `node` 和 `@playwright/test` 的类型声明。

---

### 3. 修复之前修改引入的格式问题

- `eslint.config.mjs` 注释前多余空格
- `tsconfig.json` 中 `jsonc/sort-keys` 要求的键名字母顺序

---

## ESLint 验证结果

修改前后统计对比：

| 统计项 | 修改前 | 修改后 |
|---|---|---|
| Errors | 17 | 3（均为项目已有问题，非本次引入） |
| Warnings | ~200+ | ~200+ |

修复的 errors：
- `scripts/run-playwright-e2e.mjs`：`node/prefer-global/process` 错误消失
- `eslint.config.mjs`：`style/no-multi-spaces` 错误消失
- `tsconfig.json`：`jsonc/sort-keys` 错误消失

---

## 涉及文件清单

| 文件 | 操作 |
|---|---|
| `eslint.config.mjs` | 修改：`files` 改为 glob 模式 |
| `tsconfig.json` | 修改：`include` 改为模式匹配 |

---

## 学习要点

### 关于 `@antfu/eslint-config` 的 `files` 字段

`files` 接受的是 minimatch glob 模式，不是正则。这意味着：

| 模式 | 含义 |
|---|---|
| `*` | 根目录下的文件（不含子目录） |
| `**/*` | 当前目录及所有子目录 |
| `*.{js,ts}` | 根目录下 `.js` 或 `.ts` 结尾的文件 |
| `scripts/**/*.js` | `scripts/` 目录及其所有子目录下的 `.js` 文件 |

### 为什么 `*` 只匹配根目录？

因为 ESLint 配置是扁平规则集，`files: ['*']` 只匹配配置文件所在目录（即仓库根）。如果需要覆盖 `apps/` 下的文件，必须用 `apps/**/*` 显式指定。

### 关于 `tsconfig.json` 的 `"include"`

`"include"` 也是 glob 模式：
- `*.config.ts`：根目录下所有 `.config.ts` 文件
- `**/*.ts`：所有目录下的 `.ts` 文件（但如果还有子 tsconfig，需要注意"配置继承"问题）

---

## 预防同类问题的最佳实践

1. **新建根目录 `.config.ts` 文件时**：无需改动 `eslint.config.mjs` 和 `tsconfig.json`，glob 模式会自动覆盖。
2. **新建子目录工具脚本时**：如果放在 `scripts/` 下也无需改动；如果放在其他自定义目录（如 `tools/`），则需要添加到 `files` 和 `include` 中。
3. **避免在根目录放非 Node 环境的 `.js/.ts` 文件**：glob 模式会一视同仁地授予 Node 全局变量豁免。

---

**修改日期**：2026/06/06  
**分支**：`refactor/monorepo-shared-packages`

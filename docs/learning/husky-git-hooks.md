# Husky 与 Git Hooks 学习笔记

## 1. 核心结论

Husky 和 Git 有直接关系。

更准确地说：

> Husky 是用来管理 Git Hooks 的工具。

可以这样记：

```text
Git Hooks 是 Git 在某些时机自动执行的脚本；
Husky 是帮你更方便地创建和管理这些脚本的工具。
```

三者关系：

```text
Git 负责“什么时候触发”；
Husky 负责“在哪里管理 hook”；
pnpm/npm 命令负责“具体做什么”。
```

---

## 2. Git Hooks 是什么

Git 在执行某些操作时，会提供一些“钩子”。

比如：

```text
git commit 之前
git commit message 写完后
git push 之前
git merge 之后
```

这些时机可以触发脚本。

常见 Git Hook：

| Hook 名称 | 触发时机 | 常见用途 |
|---|---|---|
| `pre-commit` | 执行 `git commit` 后、真正生成 commit 前 | 检查代码、格式化、跑测试 |
| `commit-msg` | 输入 commit message 后 | 检查提交信息格式 |
| `pre-push` | 执行 `git push` 前 | 跑测试、类型检查 |
| `post-merge` | 执行 `git merge` 后 | 自动安装依赖等 |

例如：

```text
pre-commit
```

意思是：

```text
commit 之前执行。
```

如果这个脚本执行失败，Git 就会阻止 commit。

---

## 3. 为什么需要 Husky

Git 原本就支持 hooks，但默认 hooks 放在：

```text
.git/hooks/
```

例如：

```text
.git/hooks/pre-commit
.git/hooks/commit-msg
```

问题是：

```text
.git 目录不会提交到仓库；
每个人本地的 .git/hooks 都不一样；
团队很难共享这些 hook。
```

Husky 解决这个问题。

它把 hooks 放到项目里的：

```text
.husky/
```

例如：

```text
.husky/pre-commit
.husky/commit-msg
```

这些文件可以提交到 Git 仓库，团队共享。

所以 Husky 的作用是：

> 把 Git Hooks 项目化、可提交、可共享。

---

## 4. Husky 命令分两类

官方文档容易看懵，是因为里面有两类命令。

### 4.1 初始化 Husky 的命令

例如：

```bash
pnpm exec husky init
```

这是在项目里初始化 Husky。

它通常会做几件事：

```text
1. 创建 .husky/ 目录。
2. 创建一个示例 hook，例如 .husky/pre-commit。
3. 在 package.json 里添加 prepare 脚本。
```

`package.json` 中可能出现：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

这个 `prepare` 的作用是：

```text
别人安装依赖后，自动初始化 Husky hooks。
```

所以：

```bash
pnpm exec husky init
```

属于“安装/初始化工具”的命令。

---

### 4.2 写在 hook 文件里的命令

例如：

```text
.husky/pre-commit
```

里面可能写：

```sh
pnpm exec lint-staged
```

这些命令是在 Git 的某个时机自动执行的。

流程：

```text
执行 git commit
  ↓
Git 触发 pre-commit
  ↓
Husky 执行 .husky/pre-commit 里的命令
  ↓
如果命令成功，commit 继续
  ↓
如果命令失败，commit 中断
```

所以要区分：

```text
pnpm exec husky init       初始化 Husky
.husky/pre-commit 里的命令  Git commit 时自动执行
```

---

## 5. 常见使用流程

### 5.1 安装 Husky

```bash
pnpm add -D husky
```

### 5.2 初始化 Husky

```bash
pnpm exec husky init
```

执行后可能生成：

```text
.husky/pre-commit
```

同时 `package.json` 里会有：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

### 5.3 写 hook 命令

例如 `.husky/pre-commit`：

```sh
pnpm exec lint-staged
```

意思是：

> 每次 commit 之前，先运行 lint-staged。

### 5.4 触发 hook

当执行：

```bash
git commit -m "feat: add login"
```

Git 会触发：

```text
pre-commit
```

然后 Husky 执行：

```sh
pnpm exec lint-staged
```

如果成功：

```text
commit 成功
```

如果失败：

```text
commit 被阻止
```

---

## 6. hook 文件里的命令怎么写

Husky v9 之后，hook 文件本质上就是一个 shell 脚本文件。

例如：

```text
.husky/pre-commit
```

内容可以是：

```sh
pnpm exec lint-staged
```

也可以写多行：

```sh
pnpm lint
pnpm test
```

这些命令和在终端里手动执行基本一样。

例如平时可以手动执行：

```bash
pnpm lint
```

那就可以写进：

```text
.husky/pre-commit
```

让它在 commit 前自动执行。

---

## 7. 常见 Hook 写法

### 7.1 pre-commit：提交前检查代码

文件：

```text
.husky/pre-commit
```

内容：

```sh
pnpm exec lint-staged
```

意思是：

```text
提交前只检查暂存区文件。
```

常配合 `lint-staged` 使用。

---

### 7.2 commit-msg：检查提交信息

文件：

```text
.husky/commit-msg
```

内容：

```sh
pnpm exec commitlint --edit "$1"
```

意思是：

```text
检查这次 commit message 是否符合规范。
```

这里的 `"$1"` 是 Git 传给 hook 的参数。

对于 `commit-msg` 来说，`$1` 通常是当前提交信息所在的临时文件路径。

commitlint 通过：

```bash
--edit "$1"
```

读取这个文件，然后检查提交信息。

---

### 7.3 pre-push：推送前跑测试

文件：

```text
.husky/pre-push
```

内容：

```sh
pnpm test
```

或者：

```sh
pnpm type-check
pnpm test
```

意思是：

```text
push 前先跑测试和类型检查。
```

如果失败，push 会被阻止。

---

## 8. Husky、lint-staged、ESLint 的关系

常见组合是：

```text
Husky 负责触发；
lint-staged 负责找暂存区文件；
ESLint / Stylelint 负责真正检查代码。
```

### 8.1 `pnpm exec lint-staged` 命令拆解

在 `.husky/pre-commit` 里经常会看到：

```sh
pnpm exec lint-staged
```

这条命令可以拆成两部分：

```text
pnpm exec
lint-staged
```

#### `pnpm exec` 是什么

`pnpm exec` 的意思是：

> 使用 pnpm 执行当前项目依赖里的可执行命令。

很多工程化工具都是安装在项目依赖里的，例如：

```text
husky
lint-staged
eslint
stylelint
commitlint
vitest
```

这些工具通常安装在：

```text
node_modules/.bin/
```

普通情况下，如果直接执行：

```bash
lint-staged
```

终端不一定能找到这个命令。

但执行：

```bash
pnpm exec lint-staged
```

pnpm 会帮你去当前项目依赖中找到 `lint-staged`，然后执行它。

所以：

```text
pnpm exec = 去项目依赖里找这个工具并运行。
```

类似命令还有：

```bash
pnpm exec eslint .
pnpm exec commitlint --edit "$1"
pnpm exec vitest run
```

#### `lint-staged` 是什么

`lint-staged` 是一个“暂存区文件处理工具”。

它的作用是：

> 只对本次 `git add` 到暂存区的文件执行检查、格式化或修复命令。

例如你只改了：

```text
src/a.ts
src/b.vue
```

并执行：

```bash
git add src/a.ts src/b.vue
```

当 `pre-commit` 里执行：

```sh
pnpm exec lint-staged
```

`lint-staged` 会只处理这两个暂存区文件，而不是检查整个项目。

这比直接执行：

```bash
pnpm lint
```

更快，因为 `pnpm lint` 通常会检查全项目。

#### `lint-staged` 本身不负责检查代码

需要注意：

```text
lint-staged 本身不负责判断代码是否规范；
它只是负责找到暂存区文件，并把这些文件交给 ESLint、Stylelint、Prettier 等工具处理。
```

例如 `package.json` 里可能有：

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": "eslint --fix --cache",
    "*.{css,scss,vue}": "stylelint --fix"
  }
}
```

意思是：

```text
暂存区里的 JS / TS / Vue 文件，用 ESLint 检查和修复；
暂存区里的 CSS / SCSS / Vue 文件，用 Stylelint 检查和修复。
```

所以完整职责是：

```text
Husky：在 git commit 前触发；
pnpm exec：运行项目依赖里的工具；
lint-staged：找出暂存区文件；
ESLint / Stylelint：真正检查或修复代码。
```

流程：

```text
git add src/a.ts
git commit
  ↓
Git 触发 pre-commit
  ↓
Husky 执行 pnpm exec lint-staged
  ↓
lint-staged 找到暂存区文件 src/a.ts
  ↓
ESLint / Stylelint 检查这个文件
```

为什么常用 `lint-staged`，而不是直接 `pnpm lint`？

```text
pnpm lint 通常检查整个项目，项目大了会慢；
lint-staged 只检查本次 git add 的文件，更快。
```

---

## 9. prepare: husky 是什么意思

`package.json` 里常见：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

这个脚本的作用是：

> 在安装依赖后，让 Husky 初始化 Git hooks。

当别人 clone 项目后执行：

```bash
pnpm install
```

`prepare` 会执行：

```bash
husky
```

从而让 Git 知道 hooks 在 `.husky/` 目录。

否则 `.husky/pre-commit` 文件虽然存在，但 Git 不一定会自动使用它。

---

## 10. 完整流程示例

假设 `package.json` 中有：

```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "lint-staged": {
    "*.{js,ts,vue}": "eslint --fix --cache"
  }
}
```

`.husky/pre-commit`：

```sh
pnpm exec lint-staged
```

`.husky/commit-msg`：

```sh
pnpm exec commitlint --edit "$1"
```

流程：

```text
执行 git commit -m "feat: add login"
  ↓
Git 触发 pre-commit
  ↓
Husky 执行 pnpm exec lint-staged
  ↓
ESLint 检查暂存区文件
  ↓
如果通过，进入 commit-msg
  ↓
Husky 执行 pnpm exec commitlint --edit "$1"
  ↓
commitlint 检查提交信息
  ↓
通过后生成 commit
```

如果中间任何一步失败：

```text
commit 失败
```

---

## 11. 如何判断命令写什么

核心原则：

> 希望 Git 在某个时机自动帮你做什么，就把对应命令写进对应 hook 文件。

| 想做什么 | 放在哪个 hook | 写什么 |
|---|---|---|
| 提交前检查暂存区代码 | `pre-commit` | `pnpm exec lint-staged` |
| 提交前跑全量 lint | `pre-commit` | `pnpm lint` |
| 检查 commit message | `commit-msg` | `pnpm exec commitlint --edit "$1"` |
| push 前跑测试 | `pre-push` | `pnpm test` |
| push 前类型检查 | `pre-push` | `pnpm type-check` |

---

## 12. 为什么 Husky 命令以 pnpm 开头

一个容易混淆的问题是：

> Husky 不是和 Git 相关吗？为什么命令是 `pnpm exec husky init`，而不是 `git husky init`？

答案是：

```text
Husky 管 Git Hooks，
但 Husky 本身是一个 Node 工具包，
所以安装和运行 Husky 要通过 npm / pnpm / yarn 这类包管理器。
```

也就是说：

```text
git 负责触发 hook；
husky 负责管理 hook；
pnpm 负责运行 husky 这个 npm 包里的命令。
```

---

### 12.1 `pnpm exec husky init` 拆解

```bash
pnpm exec husky init
```

可以拆成：

```text
pnpm exec：执行当前项目依赖里的可执行命令；
husky：要执行的工具；
init：husky 的初始化参数。
```

所以这条命令的意思是：

> 用 pnpm 执行项目依赖里的 Husky，并让 Husky 初始化 Git Hooks 配置。

它不是 Git 命令，因为 Git 本身没有 `husky` 这个子命令。

---

### 12.2 为什么不是 `git husky init`

Git 只认识自己的命令，例如：

```bash
git commit
git push
git status
git config
```

但 Git 不内置 Husky。

Husky 是第三方工具，来自 npm 生态。

所以要运行 Husky，需要通过包管理器：

```bash
npm exec husky init
pnpm exec husky init
npx husky init
```

这些命令的本质都是：

```text
运行 Husky 这个工具。
```

---

### 12.3 Git 在什么时候参与

完整流程可以分成两个阶段。

#### 阶段 1：安装和配置阶段

主动执行：

```bash
pnpm add -D husky
pnpm exec husky init
```

这一步是在：

```text
安装 Husky；
创建 .husky 文件夹；
配置 Git hooksPath；
让 Git 后续能找到 .husky 里的 hook 文件。
```

这里用 `pnpm`，因为 Husky 是 npm 包。

#### 阶段 2：Git 触发阶段

执行：

```bash
git commit
```

Git 会触发：

```text
.husky/pre-commit
```

如果 `.husky/pre-commit` 里写了：

```sh
pnpm exec lint-staged
```

那 Git 就会间接执行这个命令。

---

### 12.4 完整命令链

假设：

```text
.husky/pre-commit
```

内容是：

```sh
pnpm exec lint-staged
```

当执行：

```bash
git commit -m "feat: add login"
```

实际链路是：

```text
git commit
  ↓
Git 调用 pre-commit hook
  ↓
Husky 让 Git 找到 .husky/pre-commit
  ↓
执行 .husky/pre-commit 文件
  ↓
文件内容是 pnpm exec lint-staged
  ↓
pnpm 执行 lint-staged
  ↓
lint-staged 执行 ESLint / Stylelint
  ↓
检查通过后 Git 继续 commit
```

所以：

```text
配置 Husky 时，用 pnpm；
触发 hook 时，用 git。
```

---

### 12.5 一句话记忆

> Husky 管 Git，但 Husky 自己是 Node 工具，所以用 pnpm 执行。

或者记成：

```text
pnpm：运行工具；
husky：管理 hook；
git：触发 hook。
```

---

## 13. 最小记忆版

先记住这套：

```text
Husky = 管 Git Hooks。
pre-commit = commit 前执行。
commit-msg = 检查 commit message。
pre-push = push 前执行。
.husky/pre-commit 里面写终端命令。
```

最常见写法：

```sh
# .husky/pre-commit
pnpm exec lint-staged
```

```sh
# .husky/commit-msg
pnpm exec commitlint --edit "$1"
```

```sh
# .husky/pre-push
pnpm test
```

---

## 14. 一句话总结

Husky 的命令和 Git 有关。

更准确地说：

> Git 在 commit / push 等时机触发 hook，Husky 让这些 hook 可以写在项目的 `.husky/` 目录里，hook 文件里再写想自动执行的 pnpm/npm 命令。

最终可以这样记：

```text
Git 负责触发时机；
Husky 负责管理 hook 文件；
pnpm/npm 命令负责具体检查、测试或格式化。
```

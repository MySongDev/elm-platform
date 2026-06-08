# .npmrc 与 .nvmrc 工程化笔记

## 1. 核心结论

`.npmrc` 和 `.nvmrc` 都属于工程化配置文件，但它们解决的问题不同。

```text
.npmrc：配置包管理器安装依赖时的行为。
.nvmrc：声明项目推荐或要求使用的 Node.js 版本。
```

可以这样理解：

```text
.nvmrc                         用哪个 Node。
package.json 的 packageManager    用哪个包管理器和版本。
.npmrc                         包管理器怎么安装依赖。
```

它们不是业务代码，而是用来降低环境差异、依赖安装差异和团队协作成本。

---

## 2. .npmrc 是什么

`.npmrc` 是 npm 的配置文件，同时 pnpm 也会读取很多 `.npmrc` 配置。

它通常放在项目根目录，例如：

```text
project/
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  .npmrc
```

常见内容：

```ini
registry=https://registry.npmmirror.com
strict-peer-dependencies=false
auto-install-peers=true
save-exact=true
```

它的作用是：

> 说明包管理器应该按什么规则安装依赖。

`package.json` 和 `.npmrc` 的区别：

```text
package.json：声明项目需要什么依赖。
.npmrc：声明包管理器应该如何安装这些依赖。
```

---

## 3. .npmrc 解决什么问题

`.npmrc` 主要解决依赖安装一致性问题。

常见场景：

```text
不同开发者 registry 不一致。
公司私有包需要单独 registry。
peer dependency 安装策略不一致。
新增依赖版本范围不一致。
CI 和本地依赖安装行为不一致。
```

常见配置包括：

### 3.1 registry

```ini
registry=https://registry.npmmirror.com
```

作用：

```text
统一依赖下载源。
```

### 3.2 私有包源

```ini
@company:registry=https://npm.company.com
```

作用：

```text
让 @company 作用域下的包从公司私有源下载。
```

### 3.3 token 认证

```ini
//npm.company.com/:_authToken=${NPM_TOKEN}
```

注意：

> 不要把真实 token 写入并提交到仓库，应该通过环境变量注入。

### 3.4 peer dependency 策略

```ini
strict-peer-dependencies=false
```

作用：

```text
遇到 peerDependencies 不完全匹配时，不直接阻断安装。
```

代价：

```text
可能掩盖真正的依赖兼容问题。
```

### 3.5 自动安装 peer dependencies

```ini
auto-install-peers=true
```

作用：

```text
pnpm 安装依赖时自动补齐部分 peerDependencies。
```

### 3.6 精确保存依赖版本

```ini
save-exact=true
```

作用：

```text
执行 pnpm add 时，不自动加 ^ 或 ~，减少版本浮动。
```

---

## 4. .npmrc 属于什么工程化

`.npmrc` 属于：

```text
依赖管理工程化
包管理器行为规范
开发环境一致性治理
CI 安装稳定性保障
```

它不是为了实现业务功能，而是为了让项目在不同机器、不同开发者、不同 CI 环境中，以一致的方式安装和解析依赖。

---

## 5. .nvmrc 是什么

`.nvmrc` 是 Node.js 版本声明文件，通常配合 `nvm` 使用。

它一般放在项目根目录，内容只有一行，例如：

```text
20
```

或者：

```text
20.11.1
```

进入项目目录后执行：

```bash
nvm use
```

`nvm` 会读取 `.nvmrc`，并切换到对应 Node.js 版本。

如果本地没有该版本，可以执行：

```bash
nvm install
```

nvm 官方文档明确说明：当 `nvm use`、`nvm install` 等命令没有显式传入版本时，会自动查找并使用 `.nvmrc` 中声明的版本。

---

## 6. .nvmrc 解决什么问题

`.nvmrc` 主要解决 Node.js 版本一致性问题。

常见问题：

```text
A 开发者用 Node 18。
B 开发者用 Node 20。
CI 使用 Node 20。
部署环境使用 Node 18。
```

这可能导致：

```text
依赖安装结果不同。
Vite 构建行为不同。
Prisma 生成失败。
测试在本地通过，但 CI 失败。
某些现代工具不支持旧 Node 版本。
```

`.nvmrc` 的作用就是把 Node 版本要求显式写到项目里。

---

## 7. .nvmrc 是根据什么创建的

`.nvmrc` 不是随便写的，通常根据以下因素决定：

```text
项目依赖的最低 Node 要求。
package.json 的 engines 字段。
CI 使用的 Node 版本。
Docker / 部署环境使用的 Node 版本。
团队统一规范。
pnpm / yarn / npm 的版本要求。
Node LTS 周期。
```

判断流程：

```text
1. 看 package.json engines 有没有指定 Node 范围。
2. 看 CI / Docker / 部署环境当前用哪个 Node。
3. 看关键依赖最低要求，例如 Vite、Prisma、NestJS、pnpm。
4. 优先选择 LTS 版本。
5. 个人项目可写大版本，如 20。
6. 团队/CI 严格项目可写精确版本，如 20.11.1。
7. 保证 .nvmrc、engines、CI、Docker 不冲突。
```

---

## 8. .nvmrc 属于什么工程化

`.nvmrc` 属于：

```text
开发环境工程化
Node.js 版本治理
团队环境一致性
CI 环境约束
```

它解决的是：

> 项目应该运行在哪个 Node.js 版本上。

---

## 9. .nvmrc、engines、packageManager、.npmrc 的区别

| 配置 | 作用 |
|---|---|
| `.nvmrc` | 指定本地开发推荐使用的 Node.js 版本 |
| `package.json` 的 `engines` | 声明项目支持或要求的 Node.js / 包管理器版本范围 |
| `package.json` 的 `packageManager` | 配合 Corepack 固定 pnpm / yarn / npm 的版本 |
| `.npmrc` | 配置包管理器安装依赖时的行为 |

可以这样记：

```text
.nvmrc：用哪个 Node。
engines：允许哪些 Node / 包管理器版本。
packageManager：用哪个包管理器和具体版本。
.npmrc：包管理器怎么工作。
```

---

## 10. 和 Corepack 的关系

Corepack 主要解决：

```text
这个项目应该用 npm、pnpm 还是 yarn？
应该用哪个版本的包管理器？
```

例如 `package.json` 中：

```json
{
  "packageManager": "pnpm@10.0.0"
}
```

Corepack 和 `.npmrc`、`.nvmrc` 不是替代关系，而是分工协作：

```text
.nvmrc：固定 Node.js 版本。
Corepack + packageManager：固定包管理器版本。
.npmrc：固定包管理器安装行为。
```

---

## 11. L1 / L2 / L3 理解方式

### 11.1 L1：会写

知道可以创建：

```text
.nvmrc
.npmrc
```

并写入：

```text
20
```

或者：

```ini
strict-peer-dependencies=false
```

### 11.2 L2：知道为什么

理解：

```text
.nvmrc 是为了统一 Node.js 版本。
.npmrc 是为了统一依赖安装行为。
Corepack 是为了统一包管理器版本。
```

### 11.3 L3：知道该不该用

判断：

```text
这个项目是否需要固定 Node 版本？
应该写 20 还是 20.11.1？
CI 和 Docker 是否要读取同一个版本？
是否需要统一 registry？
是否应该关闭 strict-peer-dependencies？
关闭后是否会掩盖依赖风险？
是否需要 save-exact？
私有源 token 如何安全注入？
```

真正的工程化能力不是“会创建文件”，而是知道为什么创建、根据什么创建，以及它会带来什么收益和代价。

---

## 12. 总结

`.npmrc` 和 `.nvmrc` 都属于工程化，但分属不同方向：

```text
.npmrc：依赖管理工程化。
.nvmrc：开发环境工程化。
```

一句话记忆：

> `.nvmrc` 让大家用同一个 Node，`.npmrc` 让大家用同一套依赖安装规则。

更完整地说：

```text
.nvmrc 统一 Node.js 版本。
packageManager 统一包管理器版本。
.npmrc 统一包管理器安装行为。
```

它们的价值不是增加配置文件数量，而是减少项目协作中的隐性差异。

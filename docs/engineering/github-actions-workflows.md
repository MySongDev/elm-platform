# GitHub Actions 工作流编写指南

本文档基于项目中实际使用的 `ci.yml` 和 `deploy-pages.yml` 两个工作流，讲解 GitHub Actions YAML 文件的结构、每个字段的含义以及编写依据。

## 文件位置与命名

```text
.github/
  workflows/
    ci.yml              ← CI 工作流（代码检查、测试、构建）
    deploy-pages.yml    ← 部署工作流（GitHub Pages 部署）
```

- 文件必须放在 `.github/workflows/` 目录下。
- 文件名任意，扩展名必须是 `.yml` 或 `.yaml`。
- 一个文件 = 一个工作流（workflow），文件之间相互独立。

## YAML 顶层结构总览

```yaml
name: 工作流名称          # 显示在 GitHub Actions 页面的名称
on: 触发条件              # 什么时候运行
permissions: 权限配置      # 工作流需要的 GitHub 权限
concurrency: 并发控制      # 同时运行多个实例时的策略
env: 全局环境变量          # 所有 job 共享的环境变量
jobs:                     # 工作流包含的任务（核心）
  job-id:                 # 任务 ID（自定义名称）
    runs-on: 运行环境      # 在什么机器上运行
    if: 条件表达式         # 是否跳过此任务
    needs: 前置任务        # 依赖哪个任务先完成
    services: 附加服务     # 需要的数据库、缓存等容器
    environment: 部署环境  # GitHub Pages 等部署目标
    steps:                # 任务包含的步骤（核心中的核心）
      - name: 步骤名称
        uses: action引用   # 使用现成的 action
        run: shell命令     # 或执行 shell 命令
        env: 步骤环境变量
        with: 参数         # 传给 action 的参数
```

## 逐字段详解

### 1. `name` — 工作流名称

```yaml
name: CI
name: Deploy to GitHub Pages
```

- 显示在 GitHub 仓库的 Actions 页面左侧菜单。
- 可以用中文或英文，建议简洁明了。
- 如果不写，GitHub 默认使用文件名。

### 2. `on` — 触发条件

这是工作流的"开关"，决定什么时候运行。

```yaml
# 写法一：push 到指定分支时触发
on:
  push:
    branches:
      - main
      - 'codex/**'       # 支持 glob 模式

# 写法二：PR 到指定分支时触发
on:
  pull_request:
    branches:
      - main

# 写法三：手动触发
on:
  workflow_dispatch:

# 写法四：组合触发
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
```

**本项目中的用法**：

| 工作流 | 触发条件 | 原因 |
|---|---|---|
| `ci.yml` | push 到 main/codex/**、PR 到 main | 代码变更时检查质量 |
| `deploy-pages.yml` | push 到 main、手动触发 | 代码合并后自动部署 |

**编写依据**：CI 在每次代码变更时都需要运行（push 和 PR）；部署只在 push 到 main 时运行（避免 PR 阶段就部署），同时支持手动触发以便重试。

### 3. `permissions` — 权限配置

```yaml
permissions:
  contents: read      # 读取仓库代码
  pages: write        # 写入 GitHub Pages
  id-token: write     # 用于 OIDC 身份验证（部署 Pages 需要）
```

- GitHub Actions 默认有较宽的权限，但显式声明是安全最佳实践。
- `deploy-pages.yml` 需要 `pages: write` 和 `id-token: write` 才能部署到 Pages。
- `ci.yml` 不需要额外权限（默认即可）。

### 4. `concurrency` — 并发控制

```yaml
concurrency:
  group: pages              # 同组的任务共享并发控制
  cancel-in-progress: false # 是否取消正在运行的任务
```

- `group`：相同 group 名的任务视为同一组。
- `cancel-in-progress: false`：不取消正在运行的部署，等待它完成后再运行下一个。设为 `true` 则会取消正在运行的直接运行新的。

**编写依据**：部署任务不适合取消（取消可能导致部署到一半的站点不可用），所以用 `false`。

### 5. `env` — 环境变量

```yaml
# 全局环境变量（所有 job 共享）
env:
  ADMIN_BASE_URL: /elm-platform/admin/
  USER_BASE_URL: /elm-platform/user/
```

环境变量的作用域：

```yaml
# 顶层 env → 所有 job 共享
env:
  GLOBAL_VAR: value

jobs:
  build:
    # job 级别 env → 该 job 内所有 step 共享
    env:
      JOB_VAR: value
    steps:
      - name: Some step
        run: echo $GLOBAL_VAR $JOB_VAR
        # step 级别 env → 仅该 step 可用
        env:
          STEP_VAR: value
```

优先级：step env > job env > 全局 env。

**访问方式**：

```bash
# 在 run 命令中直接使用（shell 语法）
run: echo $MY_VAR

# 在 YAML 中引用其他变量
env:
  BASE_URL: ${{ env.ADMIN_BASE_URL }}
```

### 6. `jobs` — 任务

一个工作流可以包含多个 job，默认**并行执行**。

```yaml
jobs:
  lint:             # 任务 1
    runs-on: ubuntu-latest
    steps: [...]

  build-and-test:   # 任务 2（与 lint 并行）
    runs-on: ubuntu-latest
    steps: [...]

  deploy:           # 任务 3
    needs: [build-and-test]  # 等 build-and-test 完成后才运行
    runs-on: ubuntu-latest
    steps: [...]
```

**任务依赖关系**：

```yaml
needs: job-a              # 等一个任务
needs: [job-a, job-b]     # 等多个任务（都完成后才运行）
```

**本项目中的任务关系**：

```
ci.yml:
  commitlint ─────────┐
  lint ────────────────┤（并行，PR 时才运行 commitlint）
  build-and-test ──────┤
  coverage ────────────┤
  security-audit ──────┤
  e2e-smoke ───────────┤
  affected-pilot ──────┘
  api-drift ── needs: build-and-test（等构建测试完成后）

deploy-pages.yml:
  build ──→ deploy（串行，deploy 等 build 完成）
```

### 7. `runs-on` — 运行环境

```yaml
runs-on: ubuntu-latest    # GitHub 提供的 Ubuntu 虚拟机
```

可选值：

| 值 | 说明 |
|---|---|
| `ubuntu-latest` | 最新的 Ubuntu（最常用） |
| `ubuntu-22.04` | 指定版本的 Ubuntu |
| `windows-latest` | Windows |
| `macos-latest` | macOS |
| `self-hosted` | 自己的服务器 |

**编写依据**：大多数 Node.js 项目用 `ubuntu-latest` 就够了，免费且速度快。

### 8. `if` — 条件执行

```yaml
# 只在 PR 时运行
if: github.event_name == 'pull_request'

# 只在 push 时运行
if: github.event_name == 'push'

# 只在特定分支
if: github.ref == 'refs/heads/main'
```

**本项目中的用法**：

```yaml
# commitlint 只在 PR 时运行（push 时不需要校验 commit message）
commitlint:
  if: github.event_name == 'pull_request'

# affected-pilot 只在 PR 时运行
affected-pilot:
  if: github.event_name == 'pull_request'
```

### 9. `services` — 附加服务容器

当 job 需要数据库、Redis 等外部服务时，GitHub Actions 可以启动 Docker 容器。

```yaml
services:
  postgres:
    image: postgres:16              # Docker 镜像
    env:
      POSTGRES_USER: postgres       # 容器环境变量
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: elm_test
    ports:
      - 5432:5432                   # 端口映射（容器端口:宿主机端口）
    options: >-
      --health-cmd pg_isready       # 健康检查命令
      --health-interval 10s         # 检查间隔
      --health-timeout 5s           # 超时时间
      --health-retries 5            # 重试次数

  redis:
    image: redis:7
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

**关键点**：

- 容器启动后，通过 `localhost:端口` 访问（因为端口映射到了宿主机）。
- `health-cmd` 确保服务真正就绪后才继续执行 step。
- 服务容器的生命周期与 job 相同，job 结束后自动销毁。

**编写依据**：后端测试需要 PostgreSQL，E2E 测试需要 PostgreSQL + Redis，所以这些 job 配置了对应的 services。

### 10. `steps` — 步骤

每个 job 包含一系列 step，按顺序执行。step 有两种类型：

#### 类型一：使用现成的 action（`uses`）

```yaml
- name: Checkout
  uses: actions/checkout@v4       # 官方 action，拉取仓库代码
  with:                            # 传给 action 的参数
    fetch-depth: 0                 # 拉取完整 git 历史
```

**常用 action 说明**：

| action | 用途 | 来源 |
|---|---|---|
| `actions/checkout@v4` | 拉取仓库代码到 Runner | GitHub 官方 |
| `actions/setup-node@v4` | 安装指定版本的 Node.js | GitHub 官方 |
| `pnpm/action-setup@v4` | 安装 pnpm（自动读 packageManager） | pnpm 官方 |
| `actions/upload-pages-artifact@v3` | 上传 Pages 部署产物 | GitHub 官方 |
| `actions/deploy-pages@v4` | 部署到 GitHub Pages | GitHub 官方 |

**action 版本管理**：`@v4` 表示使用 v4 大版本，GitHub 会自动使用该大版本下的最新小版本。

#### 类型二：执行 shell 命令（`run`）

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

# 多行命令
- name: Assemble site
  run: |
    mkdir -p site/admin site/user
    cp -r apps/web-admin/dist/* site/admin/
    cp -r apps/web-user/dist/*  site/user/
```

#### 步骤级别的参数

```yaml
- name: Build admin
  run: pnpm build:admin
  env:                                    # 步骤级环境变量
    BASE_URL: ${{ env.ADMIN_BASE_URL }}   # 引用全局 env
  working-directory: apps/web-admin       # 指定工作目录（可选）
```

### 11. `environment` — 部署环境

```yaml
deploy:
  environment:
    name: github-pages              # 环境名称（与 Settings → Pages 对应）
    url: ${{ steps.deployment.outputs.page_url }}  # 部署后的 URL
```

- `name` 必须与 GitHub 仓库 Settings → Environments 中的环境名一致。
- `url` 显示在 GitHub 的部署状态中，方便点击访问。

### 12. `continue-on-error` — 容错

```yaml
affected-pilot:
  continue-on-error: true    # 即使这个 job 失败，整个工作流也不算失败
```

**编写依据**：`affected-pilot` 是试运行阶段的非阻塞任务，它的失败不应阻止 PR 合并。

## 步骤的完整编写模式

### 模式一：标准 Node.js 项目

几乎每个 job 的前 4 步都是相同的"环境准备"：

```yaml
steps:
  # 1. 拉代码
  - name: Checkout
    uses: actions/checkout@v4

  # 2. 安装 pnpm（自动从 package.json 的 packageManager 字段读取版本）
  - name: Setup pnpm
    uses: pnpm/action-setup@v4

  # 3. 安装 Node.js（指定版本 + 缓存 pnpm store）
  - name: Setup Node
    uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: pnpm

  # 4. 安装依赖（--frozen-lockfile 确保 lockfile 不被修改）
  - name: Install dependencies
    run: pnpm install --frozen-lockfile
```

**为什么用 `--frozen-lockfile`**：防止 CI 中意外修改 `pnpm-lock.yaml`，保证本地和 CI 使用完全相同的依赖版本。

**为什么 `cache: pnpm`**：缓存 pnpm 的全局 store 目录，第二次运行时只下载变化的包，安装速度从 30 秒降到 5 秒左右。

### 模式二：需要数据库的 job

```yaml
steps:
  # ...（环境准备同上）

  # 先构建共享包（因为应用依赖它们的类型定义）
  - name: Build workspace packages
    run: pnpm build:packages

  # 生成 Prisma 客户端（需要在运行测试前完成）
  - name: Generate Prisma client
    run: pnpm --filter @elm-platform/server run prisma:generate

  # 运行测试（通过 DATABASE_URL 连接到 services 中启动的 PostgreSQL）
  - name: Test server
    run: pnpm --filter @elm-platform/server run test
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/elm_test?schema=public
```

### 模式三：构建 + 部署

```yaml
steps:
  # ...（环境准备同上）

  # 构建
  - name: Build admin
    run: pnpm build:admin
    env:
      BASE_URL: ${{ env.ADMIN_BASE_URL }}

  # 上传产物
  - name: Upload Pages artifact
    uses: actions/upload-pages-artifact@v3
    with:
      path: site          # 上传哪个目录

# 另一个 job 负责部署
deploy:
  needs: build
  steps:
    - name: Deploy to GitHub Pages
      id: deployment                    # 给步骤一个 id，后续可以引用其输出
      uses: actions/deploy-pages@v4
```

## 项目中的可用变量

### 内置变量（通过 `${{ }}` 语法访问）

| 变量 | 含义 | 示例值 |
|---|---|---|
| `github.event_name` | 触发事件类型 | `push`、`pull_request`、`workflow_dispatch` |
| `github.ref` | 触发的分支/标签 | `refs/heads/main` |
| `github.sha` | 触发的 commit SHA | `d2028f3...` |
| `github.event.pull_request.base.sha` | PR 的基准 commit | （PR 时才有） |
| `github.event.pull_request.head.sha` | PR 的最新 commit | （PR 时才有） |
| `steps.<id>.outputs.<name>` | 步骤的输出值 | 部署 URL 等 |
| `env.<name>` | 环境变量 | `/elm-platform/admin/` |

### 引用示例

```yaml
# 引用环境变量
env:
  BASE_URL: ${{ env.ADMIN_BASE_URL }}

# 引用内置变量
run: pnpm exec commitlint --from ${{ github.event.pull_request.base.sha }}

# 引用步骤输出
url: ${{ steps.deployment.outputs.page_url }}

# 在 if 中使用
if: github.event_name == 'pull_request'
```

## 常见 Action 的 `with` 参数

### `actions/checkout`

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0          # 拉取完整历史（默认只拉最新 1 个 commit）
```

`fetch-depth: 0` 的使用场景：commitlint 需要对比 PR 前后的 commit、Turborepo affected 需要 git diff。

### `actions/setup-node`

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22        # Node.js 版本
    cache: pnpm             # 缓存 pnpm store（自动检测 lockfile 路径）
```

### `pnpm/action-setup`

```yaml
- uses: pnpm/action-setup@v4
  # 不需要 with.version，自动从 package.json 的 packageManager 字段读取
```

## 编写新工作流的步骤

1. **确定触发条件**：什么时候运行？push？PR？定时？手动？
2. **确定需要哪些 job**：哪些可以并行？哪些有依赖关系？
3. **确定每个 job 需要什么环境**：需不需要数据库？Redis？
4. **编写标准环境准备步骤**：checkout → setup pnpm → setup node → install
5. **编写业务步骤**：lint、test、build、deploy 等
6. **配置环境变量**：数据库连接字符串、API 地址等
7. **本地验证构建命令**：确保 `pnpm xxx` 命令本身能正常运行
8. **推送到 GitHub 并在 Actions 页面查看运行结果**

## 参考资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [GitHub Actions 可用变量](https://docs.github.com/en/actions/learn-github-actions/contexts)
- [GitHub Marketplace（查找可用的 actions）](https://github.com/marketplace?type=actions)
- [actions/checkout](https://github.com/actions/checkout)
- [actions/setup-node](https://github.com/actions/setup-node)
- [pnpm/action-setup](https://github.com/pnpm/action-setup)

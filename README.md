# Elm Platform

基于 Vue 3 + NestJS 的外卖平台全栈项目，采用 pnpm monorepo 架构。

## 线上访问

| 页面 | 地址 | 说明 |
|------|------|------|
| 导航首页 | https://mysongdev.github.io/elm-platform/ | 选择进入管理后台或用户端 |
| 管理后台 | https://mysongdev.github.io/elm-platform/admin/ | Vue 3 + Element Plus |
| 用户端 | https://mysongdev.github.io/elm-platform/user/ | Vue 3 + Vant |
| 后端 API | https://elm-platform.onrender.com/api | NestJS 服务 |
| API 文档 | https://elm-platform.onrender.com/api-docs | Swagger 文档 |

> 前端托管在 GitHub Pages，后端托管在 Render，数据库使用 Neon (PostgreSQL)，缓存使用 Upstash (Redis)。

## 项目结构

```
elm-platform/
├── apps/
│   ├── server/          # NestJS 后端服务
│   ├── web-admin/       # 管理后台 (Vue 3 + Element Plus)
│   └── web-user/        # 用户端 (Vue 3 + Vant)
├── packages/
│   ├── api-types/       # 从 OpenAPI 生成的接口类型
│   ├── contracts/       # 前后端共享的业务契约类型
│   ├── tsconfig/        # 共享 TypeScript 配置基线
│   └── vite-config/     # 共享 Vite 配置工具函数
├── docs/                # 架构决策、工程规范、开发报告
├── package.json         # 根配置
└── pnpm-workspace.yaml  # 工作区配置
```

## 技术栈

### 后端 (server)
- **框架**: NestJS 10
- **数据库**: Prisma ORM
- **认证**: JWT + Passport
- **缓存**: Redis (ioredis)
- **文档**: Swagger

### 管理后台 (web-admin)
- **框架**: Vue 3 + TypeScript
- **UI 组件**: Element Plus
- **状态管理**: Pinia
- **构建工具**: Vite 7
- **代码规范**: ESLint

### 用户端 (web-user)
- **框架**: Vue 3 + TypeScript
- **UI 组件**: Vant 4
- **状态管理**: Pinia
- **构建工具**: Vite 7
- **测试**: Vitest
- **Mock 数据**: vite-plugin-mock

## 快速开始

### 环境要求

- Node.js >= 22
- pnpm >= 11

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 启动所有服务
pnpm dev

# 单独启动某个服务
pnpm dev:server    # 后端服务
pnpm dev:admin     # 管理后台
pnpm dev:user      # 用户端
```

### 构建命令

```bash
# 构建所有服务
pnpm build

# 单独构建
pnpm build:server
pnpm build:admin
pnpm build:user
```

### 代码检查

```bash
pnpm lint
```

### 清理

```bash
pnpm clean  # 删除 node_modules、dist、.turbo
```

## 数据库配置

后端使用 Prisma 管理数据库，**从根目录运行**：

```bash
pnpm --filter @elm-platform/server run prisma:generate
pnpm --filter @elm-platform/server run prisma:migrate
pnpm --filter @elm-platform/server run prisma:studio
pnpm --filter @elm-platform/server run prisma:seed
```

## API 文档

启动后端服务后，访问 Swagger 文档：

```
http://localhost:3000/api-docs
```

## 主要功能

### 用户端
- 用户注册/登录
- 地址管理
- 餐厅浏览与搜索
- 购物车与下单
- 支付功能 (支付宝)
- 订单管理

### 管理后台
- 数据统计面板
- 系统管理（用户、角色、菜单、部门）
- 商业管理（餐厅、食品、订单）
- 平台管理（多租户）
- 商户入驻工作流
- 监控中心（在线用户、登录/操作/系统日志）

## 项目规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 组件采用 Composition API + `<script setup>` 语法
- 状态管理使用 Pinia
- API 请求统一封装

## License

MIT

# Elm Platform

基于 Vue 3 + NestJS 的外卖平台全栈项目，采用 pnpm monorepo 架构。

## 项目结构

```
elm-platform/
├── apps/
│   ├── server/          # NestJS 后端服务
│   ├── web-admin/       # 管理后台 (Vue 3 + Element Plus)
│   └── web-user/        # 用户端 (Vue 3 + Vant)
├── packages/            # 共享包
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

- Node.js >= 18
- pnpm >= 8

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

后端使用 Prisma 管理数据库：

```bash
cd apps/server

# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# 打开 Prisma Studio
pnpm prisma:studio

# 填充种子数据
pnpm prisma:seed
```

## API 文档

启动后端服务后，访问 Swagger 文档：

```
http://localhost:3000/api/docs
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
- 用户管理
- 餐厅管理
- 订单管理
- 配送管理

## 项目规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 组件采用 Composition API + `<script setup>` 语法
- 状态管理使用 Pinia
- API 请求统一封装

## License

MIT

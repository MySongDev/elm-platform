# @elm-platform/api-types

从后端 OpenAPI (Swagger) 规范自动生成的前端 API 类型。

## 使用方式

### 生成类型

```bash
# 1. 确保后端正在运行
pnpm dev:server

# 2. 生成类型（从 root 执行）
pnpm api:generate
```

### 在前端使用

```typescript
import type { paths, components } from '@elm-platform/api-types'

// 获取某个 API 端点的响应类型
type LoginResponse = paths['/api/auth/login']['post']['responses']['200']['content']['application/json']

// 获取 schema 组件类型
type UserDto = components['schemas']['UserInfo']
```

### CI 漂移检测

在 CI 中添加以下步骤，检测 OpenAPI spec 是否有未提交的变更：

```yaml
- name: Check API types drift
  run: |
    pnpm dev:server &
    sleep 5
    pnpm api:generate
    git diff --exit-code packages/api-types/
```

## 与 @elm-platform/contracts 的关系

- `@elm-platform/contracts` — 手写的运行时常量和领域类型（status enums、action arrays），用于前后端共享业务逻辑
- `@elm-platform/api-types` — 自动生成的 API 请求/响应形状（仅编译时类型），用于前端的接口调用类型安全

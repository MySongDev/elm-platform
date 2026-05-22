# 手机号认证与 Auth 重构设计

## 背景

当前后端已有后台管理员认证能力：`users` 表存储管理员账号，`POST /auth/login` 使用用户名和密码登录，JWT 用于后台接口鉴权，登录日志和在线用户 Redis 状态已有基础实现。用户端目前仍走 ELM 兼容接口，登录逻辑会在内存兼容数据中自动创建用户，不是真实手机号认证。

本次目标是重做认证模块边界，同时改造后台管理端和用户端登录流程：后台管理员支持用户名或手机号加密码登录；普通用户使用独立账号表，支持手机号密码、短信验证码、验证码注册和验证码登录。短信发送先做 provider 抽象，开发环境使用 mock，后续可接阿里云或腾讯云短信。

## 目标

- 后台管理员和普通用户身份彻底分离，避免普通用户 token 访问后台权限接口。
- 后台管理员只支持用户名/手机号 + 密码登录，不支持短信验证码登录。
- 保留默认可登录管理员：`admin / admin123`，并绑定手机号 `13800138000`，因此也可用 `13800138000 / admin123` 登录。
- 普通用户新增独立数据模型，不复用后台 `users` 表。
- 普通用户支持：验证码快捷注册、验证码 + 密码注册、手机号 + 密码登录、手机号 + 验证码登录。
- 用户端验证码登录时，手机号不存在的行为由配置控制，默认自动注册并登录，后续可切换为必须先注册。
- 短信验证码使用 Redis 存储和限流，开发环境 mock，生产环境禁止 mock provider 误上线。
- 后台登录页和用户端登录/注册页都接入新认证流程。

## 非目标

- 不在本期接入真实短信厂商；仅提供 provider 接口和 mock 实现。
- 不重做后台菜单、角色、按钮权限体系，只调整 JWT 身份边界和登录入口。
- 不把后台管理员迁移到新表；现有 `users` 表继续作为后台管理员表。
- 不在本期实现第三方登录、邮箱登录或国际手机号。

## 架构边界

认证模块拆成两条身份线：

1. **Admin Auth**
   - 使用现有 `User`/`users` 表。
   - 登录账号字段为 `account`，可匹配 `username` 或 `phone`。
   - 登录成功签发 `subjectType: 'admin'` 的 JWT。
   - `GET /auth/profile`、`GET /auth/menus` 等后台接口只接受 admin token。

2. **Customer Auth**
   - 新增普通用户表，例如 `CustomerUser`。
   - 登录和注册均以手机号为主身份。
   - 登录成功签发 `subjectType: 'customer'` 的 JWT。
   - 用户端 profile 和后续用户域接口只接受 customer token。

JWT payload 至少包含：

```ts
{
  sub: number
  subjectType: 'admin' | 'customer'
  phone?: string
  username?: string
  role?: string
}
```

Guard 层需要区分身份类型，避免 customer token 通过后台接口鉴权，也避免 admin token 被当成普通用户使用。

## 数据模型

### 后台管理员

保留现有 `User` 模型。seed 继续创建默认管理员账号：

- username: `admin`
- password: `admin123` 的 bcrypt hash
- phone: `13800138000`
- role: `admin`
- permissions: `['*:*:*']`
- status: `1`

`phone` 已有唯一约束，管理员登录时可通过 `username` 或 `phone` 查找同一条记录。

### 普通用户

新增 Prisma model：

```prisma
model CustomerUser {
  id          Int       @id @default(autoincrement())
  phone       String    @unique
  password    String?
  nickname    String?
  avatar      String?
  status      Int       @default(1)
  lastLoginAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("customer_users")
}
```

`password` 可为空：验证码快捷注册会创建无密码账号；验证码 + 密码注册会保存 bcrypt hash。密码登录只允许已设置密码的普通用户。

## 短信验证码设计

短信能力以接口抽象：

- `SmsProvider.sendCode(phone, code, scene)`
- mock provider 用于开发环境。
- 后续阿里云/腾讯云 provider 实现同一接口。

Redis key 设计：

- 验证码：`sms:code:{scene}:{phone}`，TTL 5 分钟。
- 发送冷却：`sms:cooldown:{phone}`，TTL 60 秒。
- 每日次数：`sms:daily:{phone}:{yyyyMMdd}`，每日最多 10 次。

验证码建议存储 hash 或包含 hash 的结构体，验证成功后删除验证码 key，避免重复使用。

配置项：

- `CUSTOMER_LOGIN_AUTO_REGISTER=true`
- `SMS_PROVIDER=mock`
- `SMS_MOCK_CODE` 可选，用于开发环境固定验证码。

生产环境如果仍配置 `SMS_PROVIDER=mock`，发送验证码时必须报错；如果后续统一做配置校验，也可在应用启动阶段直接失败。

## 后端接口

### 管理端

#### `POST /auth/login`

入参：

```json
{
  "account": "admin 或 13800138000",
  "password": "admin123"
}
```

行为：

- 用 `account` 匹配 `username` 或 `phone`。
- 账号不存在或密码错误统一返回“账号或密码错误”。
- 账号禁用返回“账号已被禁用”。
- 成功后记录登录日志、在线用户状态，并返回现有后台 token/user 结构。
- token payload 带 `subjectType: 'admin'`。

兼容策略：前端改用 `account`；后端可以在短期内接受旧字段 `username` 作为 `account` 来源，减少联调成本。

#### 后台受保护接口

- `GET /auth/profile`
- `GET /auth/menus`
- `PATCH /auth/profile`
- `POST /auth/logout`
- `GET /auth/security-logs`

这些接口只接受 admin token。

### 用户端

#### `POST /customer-auth/sms/send`

入参：

```json
{
  "phone": "13800138001",
  "scene": "login"
}
```

`scene` 可为：`login | register | reset_password`。

行为：

- 校验手机号格式。
- 检查 60 秒冷却和每日 10 次限制。
- 生成验证码，写入 Redis，调用短信 provider。
- 开发环境 mock 可在响应中返回 `debugCode` 或在服务端日志输出。

#### `POST /customer-auth/register`

入参：

```json
{
  "phone": "13800138001",
  "smsCode": "123456",
  "password": "可选"
}
```

行为：

- 校验验证码。
- 手机号已注册则返回冲突错误。
- 创建普通用户；如果传入 password，保存 bcrypt hash。
- 可选择注册后直接返回 token/profile，减少用户端二次登录。

#### `POST /customer-auth/login/password`

入参：

```json
{
  "phone": "13800138001",
  "password": "password123"
}
```

行为：

- 只允许已注册、启用、已设置密码的普通用户登录。
- 成功后更新 `lastLoginAt`，返回 customer token/profile。

#### `POST /customer-auth/login/sms`

入参：

```json
{
  "phone": "13800138001",
  "smsCode": "123456"
}
```

行为：

- 校验验证码。
- 如果手机号不存在且 `CUSTOMER_LOGIN_AUTO_REGISTER=true`，自动创建普通用户并登录。
- 如果手机号不存在且自动注册关闭，返回“手机号未注册，请先注册”。
- 成功后更新 `lastLoginAt`，返回 customer token/profile。

#### `GET /customer-auth/profile`

返回当前普通用户 profile，只接受 customer token。

## 前端流程

### 后台管理端

登录页调整：

- 输入框文案改为“用户名/手机号”。
- 提交字段改为 `account + password`。
- 默认提示保留：`admin / admin123`，并可提示 `13800138000 / admin123`。
- 登录成功后继续走现有 store、router、menus 加载流程。

### 用户端

登录页调整为三个入口：

1. **验证码登录**
   - 输入手机号。
   - 发送验证码，按钮进入 60 秒倒计时。
   - 输入验证码后登录。
   - 默认配置下，手机号不存在会自动注册并登录。

2. **密码登录**
   - 输入手机号和密码。
   - 仅已注册且设置过密码的用户可登录。

3. **注册**
   - 输入手机号。
   - 发送注册验证码。
   - 输入验证码。
   - 密码可选；不填则创建无密码账号，只能用验证码登录，后续可再设置密码。

用户端登录成功后保存普通用户 token/profile。后续用户端 API 通过 customer token 访问用户域接口。

## 错误处理

- 手机号格式错误：返回“请输入正确的手机号”。
- 管理员账号不存在或密码错误：统一返回“账号或密码错误”。
- 管理员账号禁用：返回“账号已被禁用”。
- 普通用户验证码错误或过期：返回“验证码错误或已过期”。
- 60 秒内重复发送：返回“验证码发送过于频繁”。
- 每日超过 10 次：返回“今日验证码发送次数已达上限”。
- 密码登录但未设置密码：返回“请使用验证码登录或先设置密码”。
- 自动注册关闭且手机号不存在：返回“手机号未注册，请先注册”。
- 普通用户账号禁用：返回“账号已被禁用”。
- customer token 访问后台接口：返回 401 或 403。
- admin token 访问 customer profile：返回 401 或 403。

## 测试与验证

后端测试：

- `admin/admin123` 登录成功。
- `13800138000/admin123` 登录成功。
- 管理员错误密码失败且不泄露账号存在性。
- 管理员禁用时无法登录。
- 普通用户发送验证码成功。
- 同一手机号 60 秒内重复发送被拒绝。
- 同一手机号每日超过 10 次被拒绝。
- 验证码错误或过期被拒绝。
- 普通用户验证码注册成功。
- 普通用户验证码 + 密码注册成功。
- 普通用户手机号 + 密码登录成功。
- 普通用户未设置密码时密码登录被拒绝。
- 验证码登录在自动注册开启时可创建并登录新用户。
- 验证码登录在自动注册关闭时拒绝未注册手机号。
- customer token 不能访问后台 profile/menus。
- admin token 不能访问 customer profile。

前端验证：

- 后台登录页用 `admin/admin123` 能登录。
- 后台登录页用 `13800138000/admin123` 能登录。
- 用户端验证码登录流程可用。
- 用户端密码登录流程可用。
- 用户端注册流程可用。
- 发送验证码按钮有倒计时和错误提示。

构建检查：

- `pnpm --filter vue3-elm-node run test`
- `pnpm --filter vue3-elm-node run build`
- `pnpm --filter elm-web-admin run type-check`
- `pnpm --filter elm-web-admin run build`
- `pnpm --filter vue3-elm-js run type-check`
- `pnpm --filter vue3-elm-js run build`

UI 改动完成后还需要启动后台管理端和用户端，在浏览器中实际验证黄金路径和关键错误路径。

# @elm-platform/uni-user

uni-app 用户端（**微信小程序优先**）。从 `apps/web-user`（Vue3 + Vant4 H5）迁移而来。

> ⚠️ **动手前必读 [`docs/engineering/007-uniapp-uni-user-constraints.md`](../../docs/engineering/007-uniapp-uni-user-constraints.md)**
> 那里有全部版本约束、已踩过的坑与实测依据。本文是概览，007 是权威。

---

## ★ 三条禁令（违反会静默失败，不是报错）

### 1. `@dcloudio/*` 不得改成 `latest` / `^` / tag

```jsonc
"@dcloudio/uni-app": "3.0.0-5020620260917001"   // ✅ 精确完整版本号
```

**为什么**：实测 `@dcloudio/uni-app` 的 dist-tag `latest` = `2.0.2-5020620260917001`，
其 peerDependencies 含 `@vue/composition-api: ^1.7.0`（Vue 2 的回填补丁）
→ **`latest` 指向活跃发版的 Vue 2 线**。写成 `latest` 的后果是：**能装上、能跑、看起来正常**，
但运行时是 Vue 2，`<script setup>` / `ref` / `computed` 行为异常，表现为白屏或数据不响应，**发现得很晚**。

另：`vite-plugin-uni` 的 `latest` 指向 **2021 年的 alpha**，且它完全没有 2.0.2 版本
→ 两个包的 tag 语义不一致，靠 tag 必踩坑。

### 2. 不得把 `vue` / `vite` / `pinia` 并入根 catalog

| 依赖 | 本包版本 | catalog 版本 | 为什么不能统一 |
|---|---|---|---|
| `vue` | **`3.4.21`**（精确，无 `^`） | `^3.5.26` | uni-app 内部精确锁 `@vue/compiler-*` = 3.4.21。实测 `vue` 的 `latest` = 3.5.43 → `^3.4.21` **必然解析到 3.5.x**，与编译器错配 |
| `vite` | **`5.2.8`**（精确） | `^8.0.16` | `vite-plugin-uni` 的 peerDependencies **精确锁** `vite: 5.2.8`（非 range） |
| `pinia` | **`2.1.7`**（精确） | `^3.0.4` | ★ **迁移方案原写 `^2.3.1` 是错的**：实测 2.3.1 的 peer 也要求 `vue ^3.5.11`。2.x 里最高可用版是 **2.1.7**（peer `^3.3.0`），从 2.2.8 起就冲突了 |
| `vitest` | **`3.2.4`** | `^4.1.6` | vitest 4.x 的 peer 是 `vite ^6\|\|^7\|\|^8`，与本包的 vite 5.2.8 冲突 |

**由此产生的反直觉现象**：同一 monorepo 里有**两个 vue、两个 vite、两个 pinia 版本**。
pnpm 各包独立 node_modules 可共存（Batch 0 已实测：根 `pnpm build` 6/6 全绿）。
**不要「顺手统一版本」，那会直接搞坏本工程。**

### 3. 升级 uni-app 必须是一次专门的、有验证的动作

不得顺手 `pnpm update`。改完必须**重跑 Batch 0 的全部验证项**
（清单见 `docs/engineering/007` 第三节，验证页在 `src/pages/index/index.vue`）。

遇 uni-app bug 的处理顺序：
1. 升到新的**稳定版**（非 alpha；稳定版约每 1-2 周一个）
2. `pnpm patch` 本地打补丁
3. 绕过（换 API 实现同一效果）
4. 上游提 issue
- ❌ **不退回 alpha 线**（依赖约束与稳定版完全相同，换过去只增加不确定性）
- ❌ **不退回 HBuilderX 工作流**（意味着放弃 CLI + Vite，与 monorepo 集成全部推翻）

---

## 与 `apps/web-user` 的关系

**长期并存**（迁移方案议题 9 决策）。web-user 是**在跑的生产资产**
（GitHub Pages + Linux 服务器两条部署路径），不是开发产物 → **web-user 全程不动**，
它同时作为迁移的**对比基准**与**回退方案**。

### 同源资产（改一处要同步两处，共约 344 行）

| 资产 | 行数 | 说明 |
|---|---|---|
| `services/api/endpoints/*` | 48 | 端点常量 |
| `utils/format/format.js` | 16 | 格式化 |
| `services/http/policies/*` | 90 | 请求策略。`error-message.js` 已改 `setAlertHandler()` 注入 → **端无关** |
| `utils/cart.ts` | 198 | `getImageUrl` 改依赖注入 |

复制过来的文件头统一标注：
```js
// ⚠️ 与 apps/web-user/src/... 同源，修改需同步两处。
// 不抽共享包的原因见迁移方案议题 7（真正可共享的只有 ~154 行，不值得付建包成本）。
```

**明确不共享**：样式文件（px → rpx 后会与 web-user 分叉）。
端无关的只有 4 个颜色变量与 `_mixins.scss`（实测不含任何 px/vw 字面量），
但搬到本包后**文件名去掉 `_` 前缀**（见下「坑 2」）。

### 状态常量用 `@elm-platform/contracts`，不硬编码

web-user 侧有 **10 处硬编码**订单状态字面量（`'PAID'`/`'CLOSED'`/`'PENDING'`），
本包改用 `@elm-platform/contracts/order` 的 `paymentStatuses` 等常量。

⚠️ 该包的 `exports.import` 曾指向**不存在的** `dist/index.mjs`（tsup 在 `"type": "module"`
包下实际产出 `dist/index.js`）→ ESM 消费方 `ERR_MODULE_NOT_FOUND`。**已修**。
现有两个消费方都没踩到：server 走 `require` 条件，web-admin 只用 `import type`（运行时擦除）。
本包是第一个真正 import 运行时常量值的消费方。

---

## 构建期的四个坑（已修，别改回去）

### 坑 1：`package.json` **不能写 `"type": "module"`**

**症状**：`failed to load config from vite.config.ts` / `uni is not a function`

**根因**：`@dcloudio/vite-plugin-uni` 是 **CJS** 包（`type` undefined、无 `exports`、
导出形式 `exports.default = uniPlugin`）。本包声明 `"type": "module"` 后，
Node 的 ESM↔CJS 互操作把整个 `module.exports` 当 default →
`import uni from '...'` 拿到 `{ default: uniPlugin }` 而非函数。

⚠️ 这是从 web-user/web-admin 复制 package.json 时的**惯性写法**（那两个包都有此字段）。

### 坑 2：SCSS partial **不能用 `_` 前缀命名**

**症状**：`Cannot find module '...\src\assets\styles\mixins.scss'`（`customResolver`）

**根因**：uni-app 的 `customResolver` 用 `resolve.sync` 找**确切文件名**，
不认 Sass 的 `_mixins.scss` → `@use "mixins"` partial 约定。
web-user 能工作是因为它走 Vite 原生 sass 解析。

→ 本包命名为 `mixins.scss` / `variables.scss`（**无下划线**）。
⚠️ 迁移方案 C 节说「文件名带下划线、import 路径不带」，**在本包不成立**。

### 坑 3：SCSS 注入用 `@use` 而非 `@import`

`@import` 在 Dart Sass 3.0 将移除（构建期已告警）。与 web-user 的 `createScssOptions` 一致。

### 坑 4：`vitest.config.ts` **必须独立**，不能复用 `vite.config.ts`

否则会触发 `@dcloudio/vite-plugin-uni` 的小程序编译流程
（实测输出「编译器版本：5.26（vue3）」「已开启 uni统计 2.0」），既拖慢又无必要。

且必须配 **`passWithNoTests: true`**：turbo 的 `test:unit` task 会自动纳入本包，
而测试文件要等各批次才搬入，在此之前 vitest 默认 `No test files found, exiting with code 1`
→ **根 `pnpm test` 会红**。依据 `AI_TEST_POLICY.md`「默认不加测试」。

---

## 命令

```bash
# 构建小程序（产物 dist/build/mp-weixin，用微信开发者工具「导入项目」打开）
pnpm --filter @elm-platform/uni-user run build

# 开发模式
pnpm --filter @elm-platform/uni-user run dev:mp-weixin

# 类型检查
pnpm --filter @elm-platform/uni-user run type-check

# 单元测试
pnpm --filter @elm-platform/uni-user run test:unit

# 后端（脚本名是 dev：nest start --watch）
pnpm --filter @elm-platform/server run dev
```

### 开发期连本地后端

⚠️ **小程序端没有 vite proxy 这回事** —— 请求直接发出，不经过 dev server。
`vite.config.ts` 里的 `server.proxy` **仅 H5 端生效**。

⚠️★ **必须用 `dev` 产物 `dist/dev/mp-weixin`，不能用 `build` 产物连本地**：
`build`（`uni build`）是**生产模式**，Vite 只在生产模式加载 `.env.production`（该文件不设 `VITE_API_BASE_URL`）
→ 取不到 → `config/index.ts` 落到 `isProd ? DEFAULT_PROD_BASE_URL`
= **`https://elm-platform.onrender.com/api`**（线上后端，能通、有返回，**极易误判成"连上了本地"**）。
只有 `dev`（`uni -p mp-weixin`）才读 `.env.development` → 产物里内联 `127.0.0.1:3000/api`。

1. 起本地后端 `pnpm --filter @elm-platform/server run dev`，另跑 `pnpm --filter @elm-platform/uni-user run dev`（产出 `dist/dev/mp-weixin`）
2. 微信开发者工具**导入 `dist/dev/mp-weixin`**（不是 `dist/build/...`），关闭「校验合法域名」（`manifest.json` 已设 `mp-weixin.setting.urlCheck = false`）
3. ⚠️ **真机预览时 `127.0.0.1` 不可达**（手机上的 localhost 是手机自己）
   → 用 `.env.development` 的 `VITE_API_HOST_OVERRIDE` 填开发机局域网 IP

### 上线域名切换

ICP 备案域名就绪后**只改 `.env.production` 的 `VITE_API_BASE_URL` 一处** ——
图片域名自动跟随（`ELM_ASSET_HOST` 默认值就是 `API_BASE_URL`），
因为图片走自己后端的代理端点 `GET /api/img/*`，不再直连第三方 `elm.cangdu.org`。

⚠️ 在此之前 `.env.production` 不设该变量，生产构建回退到代码里的 `DEFAULT_PROD_BASE_URL`
（当前未备案的临时部署 `elm-platform.onrender.com`）。这是预期行为。

⚠️ `import.meta.env` 在 uni-app 小程序构建下**只做构建期静态替换**，
运行时读 `process.env` 拿不到（Batch 0 已实测：产物里是内联的字面量对象）。
所以 `config/index.ts` 用 `import.meta.env.PROD` 而非 `process.env.NODE_ENV` 分支。

---

## 目录结构

```
src/
├── main.ts            # createSSRApp（不是 createApp）+ 注入各 handler
├── App.vue            # ⚠️ 不能有 template，只是生命周期容器（onLaunch/onShow）
├── pages.json         # 路由 + 分包 + preloadRule（替代 web-user 的 router/）
├── manifest.json      # 端配置（appid 待填）
├── uni.scss           # uni-app 约定的全局变量文件
├── pages/             # ★ 主包页面（tabBar 四页 + 404 + Batch 0 验证页）
├── pkg-shop/          # 分包：shop（体积最大，从 msite/search 进入 → preloadRule 用 all）
├── pkg-order/         # 分包：order + payment + PaymentResult
├── pkg-profile/       # 分包：info × 2 + address × 3（★ area-data 155.3 KB 在此）
├── pkg-auth/          # 分包：login + SmsVerification + forget
├── components/        # 公共组件（easycom 自动导入）
├── platform/          # ★★ 平台适配收口层
├── services/          # api / http（沿用 web-user 分层）
├── stores/modules/
├── composables/
├── utils/
├── config/            # index.ts（域名）+ routes.ts（路径常量单一真源）
└── static/            # 图标、字体
```

### `src/platform/` —— 平台适配收口层

**核心接缝设计**：业务代码只调 `platform/*`，**不直接碰 `uni.*`**。
将来加 H5/App 端只改这些文件内部（在 adapter 里加 `#ifdef`）。

| 文件 | 职责 | 替代 web-user 的什么 |
|---|---|---|
| `storage.ts` | `setStore`/`getStore`/`removeStore` | `utils/storage/storage.js`（localStorage） |
| `request.ts` | `uni.request` 封装 + `AbortController` → `RequestTask.abort()` | `services/http/request.js`（400 行 axios） |
| `navigation.ts` | 跳转 + 路由拦截器 + 鉴权守卫 | `router/`（364 行整体作废） |
| `location.ts` | `uni.getLocation` + 超时兜底 + 授权引导 | `navigator.geolocation` |
| `feedback.ts` | toast / confirm / loading（引用计数） | Vant 函数式 API + `AlterTip`/`ConfirmDialog`/`GlobalLoading`（命令式挂载 DOM） |
| `image.ts` | 图片 URL 构建 + 候选回退 | `utils/image/imageCandidates.js` |

⚠️ **不要一开始就铺满 `#ifdef`** —— 那是「三端全要」的写法，会显著增加当下复杂度。
当前只做小程序端，用 adapter 收口即可。

### 分包结构（Batch 1 已锁定）

⚠️ **分包结构改动要趁早** —— 后改要动所有跳转路径。
所有路径集中在 `src/config/routes.ts`（单一真源），分包调整只改那一个文件 + `pages.json`。

| 分包 | 页面 | 划分依据 |
|---|---|---|
| 主包 | msite / search / cart / profile / 404 | uni-app 硬性要求 tabBar 页在主包 |
| `pkg-shop` | shop | 体积最大（源码 108 KB），从 msite/search 进入 → `preloadRule` 用 **`all`** |
| `pkg-order` | order / payment / PaymentResult | 结算链路，从 cart 进入 → `wifi` |
| `pkg-profile` | info × 2 / address × 3 | ★ **`@vant/area-data` 155.3 KB 在 AddressAdd 里**，绝不能进主包 → `wifi` |
| `pkg-auth` | login / SmsVerification / forget | 未登录时进入 → `wifi` |

⚠️ **`profile` 页在主包但 `pkg-profile` 是分包** —— 这是必要的：
profile 是 tabBar 页必须主包，其子页（info/address）可分包。

⚠️ **area-data 进分包的前提是「静态 import」**：若将来改成主包页面引用，
它会跟着进主包（吃掉 ~20% 预算）→ 上线检查要守住这条。

### 主包体积实测（Batch 0）

**160.2 KB**，占 2MB 限制的 **7.8%**。
其中 `common/vendor.js` **79.6 KB** = uni-app 运行时 + Vue 3.4.21 + pinia。
→ 迁移方案估算的 300-500 KB **高估了 2-3 倍**，分包方案不需要更激进。

⚠️ 新的注意点：`uni-icons.wxss` 单文件 **53.3 KB**（uni-ui 把 iconfont 的 ttf base64 内联进 CSS）。
Batch 1 第 8 项落地图标方案时要复测。

---

## 已知的体验降级（刻意决策，不是缺陷）

| 项 | 现状 | 说明 |
|---|---|---|
| 飞入购物车动画 | 仅角标数字变化 | 方案议题 3 决策：动画剥离到 Batch 5，先跑通闭环 |
| 左侧分类居中 | `scroll-into-view` 顶部对齐 | 小程序端做不到居中，精确版列入 Batch 5 O2 |
| SmartImage 视口优先级 | `<image lazy-load>` + 纯并发控制 | 小程序无 IntersectionObserver |
| 页面过渡动画 | 无（微信原生切换） | ⚠️ **不可逆平台限制**，`<transition>` 不适用，已接受不排期 |
| 支付 | 小程序端提示「暂不支持」 | 后端只有支付宝 WAP（靠 `window.location.href` 跳转，小程序机制根本不可能）。桩深度 L2，接缝已留在 `platform/payment.ts` |

---

## 当前状态（2026-09-28）

- ✅ **Batch 0 骨架验证完成**：11 项中 6 项通过 + 第 8 项后端侧端到端通过；
  **5 项需在微信开发者工具/真机人工确认**（uni-ui 渲染 / uni.request / abort / 连本地后端 / `new URL()`）
- ✅ **Batch 1 第 1 项完成**：后端图片代理 `GET /api/img/*`（端到端实测通过）
- 🔄 **Batch 1 进行中**：platform 层、分包结构已落地；网络层 policies、图标、样式 codemod 待续
- ⚠️ **占位页**：17 个页面中除 Batch 0 验证页外均为占位，Batch 3 迁移时整体替换

详细实测记录：
- `docs/engineering/007-uniapp-uni-user-constraints.md`（**可进 git，权威结论**）
- `docs/reports/2026-09-27-uniapp迁移方案/batch0-verification.md`（⚠️ 该目录被 `.gitignore:81` 忽略，仅本地）

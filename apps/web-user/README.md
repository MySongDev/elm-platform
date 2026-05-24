# Vue3 ELM — 仿饿了么移动端外卖应用

基于 Vue 3 全家桶的移动端外卖 SPA，覆盖城市定位、商家浏览、搜索、下单支付、用户中心等完整业务链路。项目重点不在 UI 还原，而在移动端业务项目的工程化组织与可维护性实践。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3.5 + Composition API |
| 语言 | TypeScript（渐进式迁移，`allowJs: true`） |
| 构建 | Vite 7 |
| 路由 | Vue Router 4（Hash 模式） |
| 状态管理 | Pinia 3 + pinia-plugin-persistedstate |
| UI 组件库 | Vant 4（按需自动导入） |
| HTTP | Axios（自研策略层：重试 / 去重 / 缓存 / Loading） |
| 样式 | SCSS + 全局 Mixin & Variables |
| Mock | vite-plugin-mock + Mock.js |
| 代码规范 | ESLint（@antfu/eslint-config） |
| 测试 | Vitest + happy-dom |
| 包管理 | pnpm |

## 快速开始

### 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- pnpm（推荐 `>=9`）

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器（代理到 elm.cangdu.org）
pnpm dev

# 启动开发服务器（启用 Mock 数据，无需后端）
pnpm dev:mock

# 构建生产包
pnpm build

# 预览生产构建
pnpm preview
```

### 本地支付服务（可选）

项目包含一个 Express 支付宝沙箱服务，用于调试支付流程：

```bash
pnpm server:dev
```

### 代码质量

```bash
# TypeScript 类型检查
pnpm type-check

# ESLint 检查并自动修复
pnpm lint

# 运行测试
pnpm test

# 测试（监听模式）
pnpm test:watch
```

> `pnpm build` 会自动执行 `type-check`，构建前确保类型安全。

## 项目结构

```
vue3-elm-js/
├── mock/                    Mock 数据（动态生成）
├── server/                  本地支付宝沙箱服务
├── docs/                    架构说明文档
├── src/
│   ├── assets/              静态资源 & 全局样式
│   │   └── styles/          SCSS 变量、Mixin、Reset
│   ├── components/          全局通用组件
│   │   ├── common/          业务通用（AlterTip、ShopList、BaseState）
│   │   ├── header/          顶部导航
│   │   └── SvgIcon/         SVG 图标组件
│   ├── composables/         可复用组合式函数（TypeScript）
│   │   ├── app/             应用级（useLoadMore、useAuthRedirect、useSafeBack）
│   │   ├── ui/              UI 级（useBackTop、useAlert、useFormValidator…）
│   │   ├── swr/             数据请求（useSWR、useSWRCities、useSWRFoodCategory）
│   │   └── features/        业务级（home、address）
│   ├── config/              应用配置 & 资源配置
│   ├── directives/          自定义指令（图片懒加载）
│   ├── icons/               SVG 图标源文件
│   ├── layout/              路由布局组件
│   ├── router/              路由配置（TypeScript）
│   │   ├── index.ts         路由主入口（自动收集模块 + 鉴权守卫）
│   │   ├── types.ts         RouteMeta 类型扩展
│   │   └── modules/         按业务拆分的路由模块（*.ts）
│   ├── services/
│   │   ├── api/             按功能划分的 API 模块
│   │   │   └── endpoints/   集中管理的接口路径常量
│   │   └── http/            HTTP 封装（策略层 + 拦截器）
│   ├── stores/
│   │   ├── index.js         Pinia 注册
│   │   └── modules/         状态模块（user、address、locations、loading）
│   ├── untils/              工具函数（storage、format、logger）
│   └── views/               业务页面
│       ├── home/            首页
│       ├── city/            城市选择
│       ├── msite/           定位首页（食品分类 + 商家列表）
│       ├── food/            食品筛选
│       ├── shop/            商家详情（菜单、评价、购物车）
│       ├── search/          搜索
│       ├── login/           登录
│       ├── profile/         用户中心（信息、地址管理）
│       ├── order/           订单
│       ├── payment/         支付
│       ├── forget/          找回密码
│       └── download/        下载引导
├── tsconfig.json            TypeScript 配置
└── vite.config.js           Vite 配置（代理、插件、别名）
```

## 核心功能

### 业务功能

- **城市定位** — 浏览器 Geolocation + 饿了么反向地理编码，失败可手动重新定位
- **城市选择** — 热门城市、字母索引列表、地址搜索、搜索历史记录
- **外卖首页** — 食品分类 Swiper 轮播、附近商家列表、无限滚动加载
- **食品筛选** — 分类面板、排序面板、筛选条件组合
- **商家详情** — Tab 切换（菜单/评价）、分类侧边栏、购物车、规格选择
- **搜索** — 商家/美食搜索、搜索历史、未登录拦截
- **登录鉴权** — 路由守卫（页面级）+ 操作拦截（交互级）双层权限
- **用户中心** — 个人信息编辑、头像上传、资产概览
- **收货地址** — 地址 CRUD、省市区三级联动、表单校验
- **订单 & 支付** — 支付宝沙箱下单、支付结果轮询

### 工程能力

- **TypeScript 渐进式迁移** — `allowJs: true`，composables / router 已迁移为 `.ts`，构建时自动类型检查
- **路由模块化** — `router/modules/*.ts` 自动收集，新增页面零配置
- **API 路径集中管理** — `services/api/endpoints/*.js` 统一维护接口路径，消除硬编码散落
- **HTTP 策略层** — 请求重试（指数退避）、请求去重、内存缓存、全局 Loading、错误节流提示、日志脱敏
- **状态分层** — 用户、地址、定位、Loading 各自独立 Store，持久化按需开启
- **页面状态标准化** — BaseState 统一管理 Loading / Empty / Error 三态
- **Mock 动态生成** — 基于关键词动态生成 POI 数据，不依赖硬编码

## 架构设计

### HTTP 层（`src/services/http/`）

```
http.js        → 对外门面（get/post/put/patch/del）
request.js     → Axios 实例 + 拦截器编排
policies.js    → 策略逻辑：重试、去重、缓存、位置注入、错误处理
loading.js     → 全局 Loading 状态联动
log.js         → 请求日志 & 敏感数据脱敏
```

通过 `config.meta` 携带行为标记，业务调用时声明式开启能力：

```js
get('/api/shops', params, {
  cache: true, // 启用内存缓存
  cacheMaxAge: 60000, // 缓存 60 秒
  dedupe: 'cancelPrevious', // 取消前一个相同请求
  retry: 3, // 失败重试 3 次
  loading: true, // 显示全局 Loading
  location: true, // 注入经纬度
})
```

### 路由模块化

```ts
// src/router/modules/shop.ts
import type { RouteRecordRaw } from 'vue-router'

export default [
  {
    path: '/shop/:id',
    component: () => import('@/views/shop/shop.vue'),
    meta: { title: '商家详情', requiresAuth: false },
  },
] satisfies RouteRecordRaw[]

// src/router/index.ts — 自动收集
const modules = import.meta.glob('./modules/*.ts', { eager: true })
```

### 状态管理

```
store-user.js       → 用户信息 & 登录态（持久化）
store-address.js    → 收货地址 CRUD
store-locations.js  → 经纬度 & 地理信息
store-loading.js    → 全局 Loading 状态
```

### API 路径集中管理（`src/services/api/endpoints/`）

接口路径从各 API 模块中抽离，按业务域集中维护：

```
auth.endpoints.js     → 登录、注册、验证码、修改密码、退出
user.endpoints.js     → 用户信息、头像、收货地址
shop.endpoints.js     → 商家列表、详情、菜单、评价
food.endpoints.js     → 食品分类、配送方式、筛选属性
city.endpoints.js     → 城市列表、城市详情、逆地理编码、POI 搜索
msite.endpoints.js    → 附近 POI
search.endpoints.js   → 商家搜索
payment.endpoints.js  → 支付宝下单、支付状态、订单列表
```

```js
// endpoints/shop.endpoints.js
export const shopEndpoints = {
  list: '/shopping/restaurants',
  detail: (shopId) => `/shopping/restaurant/${shopId}`,
  menu: '/shopping/v2/menu',
  ratingTags: (shopId) => `/ugc/v2/restaurants/${shopId}/ratings/tags`,
  ratings: (shopId) => `/ugc/v2/restaurants/${shopId}/ratings`,
}

// api-shop.js — 引用路径常量
import { shopEndpoints } from './endpoints/shop.endpoints'

export const getShopDetail = (shopId) => get(shopEndpoints.detail(shopId))
```

### Composables（TypeScript）

组合式函数按职责分层组织：

```
composables/
├── app/           应用级逻辑
│   ├── useLoadMore.ts        通用分页加载（泛型、AbortController、重试）
│   ├── useAuthRedirect.ts    登录拦截 & 回跳
│   └── useSafeBack.ts        安全返回（防死循环）
├── ui/            UI 交互逻辑
│   ├── useBackTop.ts         回到顶部（Window / Element 双目标）
│   ├── useFormValidator.ts   Schema 驱动表单校验
│   ├── useAlert.ts           轻提示
│   └── ...
├── swr/           数据请求策略
│   ├── useSWR.ts             SWR 核心（缓存 + 重新验证）
│   ├── useSWRCities.ts       城市数据
│   └── useSWRFoodCategory.ts 食品分类数据
└── features/      业务特征逻辑
    ├── home/      useHomeLocation — 定位 & 城市选择
    └── address/   useAddressDisplay — 地址展示格式化
```

## 文档

| 文档 | 说明 |
|------|------|
| [项目亮点](docs/project-highlights.md) | 设计决策与面试讲解 |
| [UI 状态规范](docs/ui-state-guidelines.md) | 页面状态管理规范 |
| [Loading 架构](docs/loading-architecture.md) | Loading 系统设计 |

## 环境变量

开发环境通过 Vite 代理转发 API 请求，无需额外配置。Mock 模式下所有接口由本地 Mock 服务响应。

支付服务需要配置支付宝沙箱密钥，详见 `server/config.js`。

## License

MIT

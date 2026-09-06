# Web User Local Mock

基于 `vite-plugin-mock`，与 `web-admin` 保持同一套接入方式。

## 启用

```bash
# 推荐
pnpm --filter @elm-platform/web-user run dev:mock

# 或在 development 模式下强制开启
VITE_USE_MOCK=true pnpm --filter @elm-platform/web-user run dev
```

开启条件（见 `vite.config.js`）：

- `command === 'serve'`
- 且 `mode === 'mock'` 或 `VITE_USE_MOCK === 'true'`

## 目录约定

```text
mock/
├── mock-utils.js          # 随机数据工具（非路由，不会被插件扫描为接口）
├── restaurants.js         # 商家数据生成逻辑（被 routes 引用）
├── routes/                # vite-plugin-mock 扫描目录
│   ├── address.js
│   ├── pois.js
│   ├── restaurants.js
│   └── shopreviews.js
└── README.md
```

- 插件配置：`mockPath: 'mock/routes'`
- 每个 `routes/*.js` 需 `export default MockMethod[]`
- 测试文件可用 `*.test.js` 命名；当前 `ignore: /\.test\.[cm]?[jt]s$/`

## 行为

- 命中 mock 路由：直接返回 JSON
- 未命中：继续走 Vite proxy（不是完全离线模式）
- 开发日志：`logger: true` 时终端会打印命中的 mock 请求

## 已覆盖路由

| Method | Path | Source |
| --- | --- | --- |
| GET | `/v1/users/1/addresses` | `routes/address.js` |
| GET | `/v4/restaurants` | `routes/restaurants.js` + `restaurants.js` |
| GET | `/v1/pois` | `routes/pois.js` |
| GET | `/api/ugc/v2/restaurants/:restaurant_id/ratings` | `routes/shopreviews.js` |
| GET | `/ugc/v2/restaurants/:restaurant_id/ratings` | `routes/shopreviews.js` |
| GET | `/api/ugc/v2/restaurants/:restaurant_id/ratings/tags` | `routes/shopreviews.js` |
| GET | `/ugc/v2/restaurants/:restaurant_id/ratings/tags` | `routes/shopreviews.js` |

登录、支付、城市、食品分类、商家详情等未 mock 的接口仍走 proxy。

## 新增接口

1. 在 `mock/routes/` 新增文件，例如 `orders.js`
2. 默认导出数组：

```js
export default [
  {
    url: '/v1/orders',
    method: 'get',
    response: ({ query, body, headers }) => {
      return []
    },
  },
]
```

3. 保存后开发服务器会 watch 热更新（`watchFiles: true`）

## 与旧自定义 mock 的差异

| 项 | 旧自定义插件 | 现 `vite-plugin-mock` |
| --- | --- | --- |
| 接入 | `mock/mock-plugin.js` 手写 middleware | 官方/社区插件 |
| 路由发现 | 手写 `routes.js` 汇总 | 扫描 `mock/routes` |
| 动态参数 | 自研 `:id` matcher，response 收 `params` | `path-to-regexp`；路径参数会并入 `query` |
| 响应头 | 自定义 `X-Elm-Mock: web-user` | 插件默认 JSON 响应（无该头） |
| 与 admin 对齐 | 否 | 是 |

说明：当前业务 handler 主要用 `query`，路径参数路由未依赖 `params` 字段，因此可直接迁移。

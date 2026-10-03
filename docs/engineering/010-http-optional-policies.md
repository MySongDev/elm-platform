# 010 - HTTP 可选策略插件（缓存 / 去重 / 重试）

> 状态：**未接入应用**（留档）
> 代码：`apps/web-user/src/services/http/extras/optional-policies.js`
> 用例：`apps/web-user/src/services/http/extras/optional-policies.test.js`
> 落档日期：2026-10-02

## 这是什么

web-user 的全局 HTTP 层（`src/services/http/`）曾内联三段可选的请求策略，靠 `meta` 上的开关驱动：

| 策略 | 开关 | 关闭时的默认行为 | 打开后 |
| --- | --- | --- | --- |
| 缓存 | `meta.cache` + `meta.cacheMaxAge` | 每次都发网络请求 | 命中未过期缓存则跳过网络，直接返回上一次的响应 |
| 去重 | `meta.dedupe`（`ignoreCurrent` / `cancelPrevious`） | 重复请求各发各的 | 同一 key 的在飞请求被忽略或被取消 |
| 重试 | `meta.retry`（次数，默认 3） | 失败即失败 | GET 遇网络错误/429/5xx 时指数退避重发 |

三者都设计成 **opt-in**：不开开关就一行代码都不执行，所以运行时零开销，这也是它们能长期留在主链路却没人发现的原因。

## 为什么现在不在主链路里

2026-10-02 做了一次全量引用排查，结论是**三段策略从来没有任何业务接口开启过**：

```bash
# 找「谁传了 retry / dedupe / cache 参数」
rg "\b(retry|dedupe|dedupeKey|cache|cacheMaxAge)\b\s*:" apps/web-user/src --glob '!**/http/**'
# 命中：只有 api-miste.js 当我临时加的 cache:true / cacheMaxAge:30000
```

配套的 `useCache` / `useDedupe` / `useRetry` 三个包装函数，除 `policies.test.js` 和 `policies/index.js` 的纯 re-export 外零引用；`clearHttpCache` 同样无人调用（意味着即使开了缓存也没有任何真实失效时机）。

即：**能力在、接线对、有测试，但没有调用方**——占着主链路和一个 60 行的测试面，属于预埋死代码。与之相比，**定位策略（`useLocation`）有真实调用方**（`api-miste.js` 的 `location: true`），所以保留在主链路。

## 三段策略的机制要点（读代码前先看这个）

### 缓存：为什么用「哨兵错误」而不是直接返回

Axios 的请求拦截器**没有「直接返回响应」这条路径**——它只能返回 config 或抛错。所以原实现的做法是：命中缓存时抛一个 `code: 'USE_CACHE'` 的错误，再由**响应拦截器的 rejected 分支**把它还原成正常结果（`request.js` 旧版 `_getCache` 与 `if (error?.code === 'USE_CACHE') return Promise.resolve(error.data)` 成对存在）。

这带来一个硬约束：**缓存检查必须排在其余响应错误处理之前**，否则哨兵错误会被当成真网络错误弹窗。在原实现里两者写在同一个拦截器对里，天然满足；一旦拆开成独立插件，这个顺序就不再有保证——这是它「不能随手 install 一下」的根本原因。

### 去重：key 的构成决定了粒度

`createRequestKey` = `method:url?params:data`。注意它**包含 body**，所以两条 body 完全相同的 POST 会被判为重复——对「提交订单」这类接口开去重是危险的，开之前先确认接口是幂等的。也支持用 `meta.dedupeKey` 手动覆写 key。

### 重试：只救网络与 5xx

`isRetryableError` 只认 `ECONNABORTED` / `ERR_NETWORK` / `429` / `>=500`，**4xx 一律不重试**（业务错误重试没有意义）。退避是 `300ms * 2^(n-1)` 再加同量级随机抖动。原实现每次重试前会先 `finishGlobalLoading`，否则全局 loading 计数会因为「上一个请求没走完就发新请求」而永远归不了零。

## ⚠️ 注意事项 / 易踩的坑

1. **缓存 key 不含定位头**（最坑的一条）。`getCacheKey` 只看 `method:url?params`，而 web-user 的经纬度是走**请求头** `X-Latitude` / `X-Longitude` 注入的（`_attachLocation`），不在 params 里。所以对商家列表这类接口开缓存后，**用户切换城市/地址，offset/limit 没变 → 命中旧缓存 → `cacheMaxAge` 窗口内仍然返回上一个位置的商家**。当年若真开了这个缓存，这就是必然会踩的线上问题。
   - 正确做法：把定位维度并入 key（例如 `createRequestKey` 里拼上 `config.headers['X-Latitude']`），或在定位变更（`store-locations.setLocation`）时调用 `clearHttpCache()`。**加缓存必须同时定义何时失效**。
2. **缓存短命且不持久**：存在 `new Map()` 里，刷新页面即清空，多标签页之间不共享。适合「同一屏内反复切换 tab」这类场景，不适合当离线缓存用。
3. **`?` 与 `null` 参数的 key 区分度**：`stableStringify(null)` 返回 `''`，而 `undefined` 参数会被 axios 从 query 里丢掉，两者可能撞 key。传参时避免 `null` 与「不传」混用。
4. **去重按 body 判重**，非幂等 POST 不要开（见上）。
5. **重试会放大流量**：最坏 `1 + 3` 次请求，且对**支付/下单**这类接口绝不该开。
6. **`meta` 是挂在 config 上的可变对象**，重试时 `request(config)` 复用同一个 config，所以 `retryCount` / `authRetried` / `loadingStarted` 这些标记能跨重试累积——这是有意为之，但也意味着 config 不能被并发复用。

## 如何重新接入

按下面 5 处改回去即可（顺序即执行顺序）：

**1. `request.js` 顶部引入**

```js
import {
  beginDedupe,
  calcRetryDelayMs,
  endDedupe,
  readCache,
  shouldRetry,
  writeCache,
} from './extras/optional-policies'
```

**2. 请求拦截器：缓存 + 去重**（插在 `const meta = getMeta(config)` 之后、`meta.traceId = ...` 之前）

```js
// 缓存命中：抛哨兵错误，由响应错误分支还原
const cachedData = readCache(config)
if (cachedData) {
  const cacheHit = new Error('Use cached response')
  cacheHit.code = 'USE_CACHE'
  cacheHit.config = config
  cacheHit.data = cachedData
  return Promise.reject(cacheHit)
}

// 可选策略：去重
if (meta.dedupe)
  beginDedupe(config)
```

**3. 响应成功分支：收尾去重 + 写缓存**

```js
const config = response.config
if (config) {
  endDedupe(config)
  finishGlobalLoading(config)
}

// ...业务错误码处理之后...
if (getMeta(config).cache)
  writeCache(config, response.data)
```

**4. 响应错误分支：还原缓存命中 + 去重收尾 + 重试**（放在函数最前面）

```js
// 缓存命中：直接返回缓存数据
if (error?.code === 'USE_CACHE')
  return Promise.resolve(error.data)

const config = error?.config
const meta = config ? getMeta(config) : {}
// ...
endDedupe(config)

// 可选策略：重试（仅 GET、可重试错误、未超限）
const nextRetryCount = config ? shouldRetry(config, error) : 0
if (nextRetryCount) {
  meta.retryCount = nextRetryCount
  finishGlobalLoading(config)
  await new Promise(resolve => setTimeout(resolve, calcRetryDelayMs(nextRetryCount)))
  return request(config)
}
```

**5. `http.js`：把开关透传进 `meta`**

```js
const { /* ... */ location = false, cache = false, cacheMaxAge, retry, dedupe, dedupeKey, ...rest } = options

meta: {
  ...(rest.meta || {}),
  loading, loadingText, loadingDelay, loadingMinDuration,
  location,
  cache, cacheMaxAge,
  retry, dedupe, dedupeKey,
}
```

之后接口上就能写 `get(url, params, { cache: true, cacheMaxAge: 30000 })` 或 `{ retry: 2 }` 了。**别忘了同步处理上面「坑 1」的定位失效问题。**

## 什么时候不该用这套

如果目标只是「让首页列表别重复发请求 / 别闪」，手写这三段是性价比很低的路线——缓存失效时机、去重粒度、重试放大都要自己兜。这类需求更该直接上 `@tanstack/vue-query`：`queryKey` 显式把定位纳入缓存身份（坑 1 自然消失），in-flight 共享即去重，重试内置，还白送 SWR / 窗口聚焦重取 / 逐查询 `isFetching`。

本模块的价值在**教学与备选**：它是「不用额外依赖时能写到什么程度」的参照实现，也是理解 Vue Query 那些默认值从哪来的对照物。

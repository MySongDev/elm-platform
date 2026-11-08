# 012 - 图片懒加载：v-lazy 与 SmartImage

> 适用：`apps/web-user`（主），`apps/uni-user`（同源副本，见第 7 节）
> 最近更新：2026-11-08（uni-user 改为仅由原生 lazy-load 调度；web-user 的队列机制不变）

## 1. 一句话

web-user 有两种图片懒加载：指令 `v-lazy` 和组件 `SmartImage`。两者都是「图片快进入视口 → 停留一小段时间 → 交给全局调度器排队加载」，共用同一个调度器。区别在于离开视口后怎么处理，以及加载中、失败时的显示。

## 2. 功能清单

### v-lazy

文件：`apps/web-user/src/directives/lazy.js`

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 全局共用一个 Observer | `getObserver()` | 所有用了 v-lazy 的图片共用一个 IntersectionObserver。观察范围是视口加下方 200px，图片露出 1% 就算进入 |
| 停留 200ms 才加载 | Observer 回调里的 `setTimeout` | 进入后开始计时，200ms 内离开就清掉计时器，不发请求 |
| 加载中占位 | `TRANSPARENT_GIF` | 进入后先给 `src` 赋一张 1×1 透明 GIF，避免出现裂图图标，同时加上 `img-loading` 类（这个类没有对应样式） |
| 只触发一次 | 计时器回调里的 `unobserve` | 停留满 200ms 后就不再观察这张图，之后滑走滑回都不会再处理 |
| 并发排队 | `scheduleElement()` → `scheduleImageTask` | 和 SmartImage 共用调度器：最多 6 张同时加载，其余按顺序排队 |
| 加载成功 | `scheduleElement()` 里的 `onLoad` | 移除类名，归还并发名额 |
| 加载失败 | `scheduleElement()` 里的 `onError` | `src` 换成内联 SVG「加载失败」（`ERROR_PLACEHOLDER`），加上 `img-error` 类，归还并发名额 |
| 地址变化重新加载 | `updated` 钩子 → `cancelElement()` | 绑定的 url 变了就取消旧的那次，包括计时器、排队中的任务和正在下载的名额，然后重新观察 |
| 卸载清理 | `unmounted` 钩子 → `cancelElement()` | 取消计时器和排队任务，归还正在占用的名额，停止观察 |

### SmartImage

目录：`apps/web-user/src/components/common/SmartImage/`

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 每个实例一个 Observer | `useImageVisibility.js` 的 `start()` | 每个组件各建一个 IntersectionObserver。观察范围默认视口加下方 200px（`rootMargin` prop 可改），露出 1% 就算进入 |
| 停留 150ms 才加载 | `useImageVisibility.js` 的 `onChange()` 里的 `setTimeout` | 进入后开始计时，没停满就离开则清掉计时器、不发请求。时长由 `loadDelay` prop 控制，传 `0` 表示不等 |
| 离开即撤销 | `useSmartImage.js` 的 `cancelQueued()` | 还在排队时滑走，任务撤出队列；滑回来重新排。已经开始下载的不受影响 |
| 并发排队 | `useSmartImage.js` 的 `load()` → `scheduleImageTask` | 和 v-lazy 共用调度器：最多 6 张同时加载，其余按顺序排队 |
| 骨架屏 | `SmartImage.vue` 的 `.smart-img__skeleton` | 加载前显示闪光占位，`skeleton` prop 设为 `false` 可关 |
| 渐进显示 | `SmartImage.vue` 的 `.smart-img__img--progressive` | 加载前模糊放大，加载完 0.35s 过渡到清晰，`progressive` prop 设为 `false` 可关 |
| 加载成功 / 失败 | `useSmartImage.js` 的 `settle(ok)` | 清掉 `onload`/`onerror`，归还并发名额，更新 `loaded` / `failed` 状态 |
| 失败占位 | `SmartImage.vue` 的 `.smart-img__broken` | 隐藏 `<img>`，显示「加载失败」文字块，带 `aria-label` |
| 地址变化重新加载 | `useSmartImage.js` 的 `watch(src)` → `abort()` | `src` 变了就撤掉排队任务、归还正在下载的名额、重置状态，然后重新观察 |
| 卸载清理 | `useSmartImage.js` 的 `onScopeDispose` → `abort()` | 停止观察，撤掉排队任务，归还正在占用的名额 |
| 兜底 | `useImageVisibility.js` 的 `start()` | 浏览器没有 IntersectionObserver 时直接加载 |

### 两者都没有的功能

优先级、CDN/源站切换、按网络调整并发数、加载事件、预加载接口。这些都曾经有过，2026-11-06 因为没有调用方或从未生效而删除（见第 9 节）。**再加回来之前，先确认有真实的调用方。**

## 3. 选哪个

| 场景 | 用法 |
|---|---|
| 列表里的大量图片，想要骨架屏和失败占位 | `SmartImage` |
| 普通 `<img>`，样式已经写好，不想多包一层 `div` | `v-lazy` |
| 首屏顶部、一定会看到的图 | 直接写 `<img :src>`，不用懒加载 |

现在的调用方：

| 用法 | 文件 |
|---|---|
| `SmartImage` | `components/common/ShopList/ShopItem.vue`（商家图） |
| `v-lazy` | `views/shop/components/ShopReview/ReviewItem.vue`（头像、评价图）、`views/shop/components/ShopMenu/MenuFoodItem.vue`（菜品图） |

```vue
<!-- SmartImage：宿主必须给尺寸，组件内部是 width/height: 100% -->
<SmartImage :src="url" :alt="name" class="item-img" />

<!-- v-lazy：值就是图片地址 -->
<img v-lazy="url" class="food-img">
```

## 4. 共用的调度器

文件：`src/utils/image/imageLoadScheduler.js`，只导出 `scheduleImageTask({ run })`。

| 规则 | 说明 |
|---|---|
| 并发上限 | 同时最多 `IMAGE_LOAD_BASE_CONCURRENCY` 张（默认 6，`VITE_IMAGE_LOAD_CONCURRENCY` 可改），全局共享 |
| 顺序 | 先来先出，没有优先级 |
| 名额怎么还 | 任务执行时调用方拿到 `release`，图片 `onload` / `onerror` 时调用它。**不调就一直占着** |
| `cancel()` | 只能撤掉还在排队的任务。已经开始的不受影响 |

`<img src>` 一旦赋值，浏览器就开始下载，前端没有办法中止（`<img>` 不支持 AbortController）。所以「取消」只有两种含义：

- 还在排队：撤出队列，不再赋值 `src`。
- 已经在下载：如果之后还会走 `onload`/`onerror`，让它自然还名额；如果要清掉 `onload`/`onerror`（切换地址、卸载），必须当场调 `release`，否则名额泄漏。累计泄漏 6 个，所有图片都不再加载。

## 5. 两者的行为对比

| | `v-lazy`（`src/directives/lazy.js`） | `SmartImage`（`src/components/common/SmartImage/`） |
|---|---|---|
| Observer | 所有元素共用一个 | 每个实例一个 |
| 观察范围 | 视口 + 下方 200px（写死） | 默认同上，`rootMargin` prop 可改 |
| 停留时间 | 200ms（写死） | 默认 150ms，`loadDelay` prop 可改，传 `0` 表示不等 |
| 停留满之后 | `unobserve`，不再关心 | 继续观察 |
| 排队中滑走 | **不撤销**，轮到时照样加载 | 撤出队列，滑回来重新排 |
| 加载中 | 透明 GIF 占位 + `img-loading` 类 | 骨架屏闪光；`progressive` 开启时从模糊过渡到清晰 |
| 失败 | `src` 换成内联 SVG「加载失败」+ `img-error` 类 | 隐藏 `<img>`，显示「加载失败」div |
| 地址变化 | `updated` 钩子：取消旧的，重新观察 | `watch(src)`：取消旧的，重新观察 |
| 无 IntersectionObserver | 报错 | 直接加载 |

SmartImage 的 props：`src`（必填）、`alt`、`skeleton`（默认 true）、`progressive`（默认 true）、`rootMargin`、`loadDelay`。没有事件。

SmartImage 的代码分三层，改的时候先找对层：

| 文件 | 负责 |
|---|---|
| `SmartImage.vue` | 模板和样式：骨架屏、渐进模糊、失败占位 |
| `useSmartImage.js` | 加载状态（`loaded`/`failed`），对接调度器，归还名额 |
| `useImageVisibility.js` | 只管「进入且停满 loadDelay」和「离开」两个时机 |

## 6. 已知缺口

| 问题 | 影响 | 处理建议 |
|---|---|---|
| v-lazy 排队中滑走不撤销 | 快速滑动且前 6 张没下完时，已经滑走的图仍会发请求 | 需要时参照 SmartImage：离开时调 `attempt.task.cancel()`，并且不要在停留满后立刻 `unobserve` |
| `img-loading` / `img-error` 没有样式 | 加载中是一块透明区域 | 要占位效果就在全局样式里补这两个类 |
| v-lazy 没有 IntersectionObserver 兜底 | 极老浏览器报错 | 现代移动端都支持，暂不处理 |
| `MenuFoodItem.vue:66` 同时写了 `v-lazy` 和 `loading="lazy"` | 原生懒加载是多余的 | 可以删掉 `loading="lazy"` |
| `VITE_IMAGE_LOAD_CONCURRENCY` 填了非数字 | `Number()` 得到 `NaN`，`active < NaN` 恒为 false，**所有图片都不加载** | 只填正整数 |

## 7. uni-user 的差异

uni-user 的 SmartImage（`apps/uni-user/src/components/common/SmartImage/SmartImage.vue`）仅使用原生 `<image lazy-load>` 调度，不使用 web-user 的浏览器 Observer 和 JS 并发队列。

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 原生懒加载 | `SmartImage.vue` 的 `:lazy-load="!eager"` | 普通图由小程序判断何时下载；不为离屏、隐藏的图预占 JS 名额 |
| 延迟绑定地址 | `start()` | 默认等 150ms 绑定 src；这是错峰，不是「进入视口后停留」 |
| 首屏立即加载 | `eager` prop + `start()` | 跳过延迟，并关闭原生 lazy-load；ShopHeader 已使用 |
| 加载状态展示 | `settle()` + 模板 | load 收起骨架屏，error 显示失败占位；无地址时不创建 image |
| 换源与卸载清理 | `clearPending()` | 仅撤销待绑定 src 的定时器，不声称取消原生已发出的请求 |

没有 `rootMargin`、`v-lazy`、JS 图片并发上限或队列优先级。

**2026-11-08 修复的阻塞链**：旧版先入 JS 队列取得 6 个名额，再绑定 src 给原生 lazy-load。原生可能因离屏或隐藏不发请求，因而没有 load/error 释放名额；第 7 张及后续图片就没有 src。页面栈中上一页仍存活、shop 的评价区用 v-show 隐藏，都是可能留下等待可见图片的场景。旧 eager 只跳过延迟，既不绕过队列，也没有关闭 lazy-load。

已用旧调度器复现「6 个不结算的任务阻止后续头图执行」，并用新开发编译产物验证「20 张未结算普通图不阻塞 eager 头图」。这验证的是 JS 调度机制，不等于微信原生网络/可见性验收。

调度器留档在 `apps/uni-user/src/utils/image/extras/imageLoadScheduler.js`，启用指南见 [014](014-uni-user-image-scheduler-extras.md)。只限 uni-user 撤下；web-user 仍保留「先判断可见、再入队」机制，**不要同步撤下 web-user 队列，也不要因为同源约定把旧队列重新接到 uni-user**。

## 8. 改动后怎么验证

```bash
# web-user 单测（调度器、SmartImage、v-lazy）
pnpm --filter @elm-platform/web-user exec vitest run src/components/common/SmartImage src/utils/image src/directives

# uni-user 没有单测，至少跑类型检查和构建
pnpm --filter @elm-platform/uni-user run type-check
pnpm --filter @elm-platform/uni-user run build:mp-weixin
```

手动验证 web-user 的「快速滑过不发请求」：Chrome DevTools → Network 勾选 Img，节流选 Slow 4G，在首页商家列表快速甩到底，只有停下来的那一屏应该出现请求。

uni-user 验收：连接本地后端时启动 `pnpm --filter @elm-platform/uni-user run dev:mp-weixin`，微信开发者工具导入 **`dist/dev/mp-weixin`**。完整重新编译后从首页进入 shop：头图立即请求，首屏菜品图加载；切到评价再切回，滚到后续分类，返回首页再进另一店，均不应全体停在骨架屏。原生懒加载的离屏预加载距离与「停留 150ms」不是同一语义，不套用 web-user 的人工判据。

## 9. 历史

- 起点是 `v-lazy`，为解决「快速滑过也发请求」加了停留时间。
- SmartImage 曾叠加 CDN 候选回退、网络自适应并发、优先级队列、双 Observer、`eager`/事件/`preloadImageUrl` 等功能，2026-11-06 全部删除（无调用方，或从未生效）。删除理由和前后代码对比见本地报告 `docs/reports/web-user/2026-11-06-SmartImage精简/report.md`（不进 git）。需要找回时用 `git show 437c03e^:<path>`。

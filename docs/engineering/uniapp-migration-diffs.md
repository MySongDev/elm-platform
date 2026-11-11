# H5 → uni-app (微信小程序) 迁移差异速查表

> 遇到新坑**当场**追加一条，别事后补。每条必须含：对比表格 + 编译产物证据行号或源码行号。
> 重要坑同步到 `007-uniapp-uni-user-constraints.md` 的「新发现的坑」编号。

---

## 1. `<text>` 不可嵌套非文本节点
**证据**：`ProfileCard.wxml` 产物里 `<text class="profile-card_desc"><svg-icon .../>{{g}}</text>` 违规；微信文档明确 `<text>` 只支持嵌套 `<text>`。

| 场景 | H5 写法 | 小程序限制 | 修正写法 |
|---|---|---|---|
| 图标+文字同行 | `<span><SvgIcon />文字</span>` | `<text>` 只能嵌套 `<text>` | 外层改 `<view>` + `display:flex; align-items:center`，文案单独包 `<text>` |

**本项目修正**：`ProfileCard.vue:43-54` → 外层 `<text>` 改 `<view class="profile-card_desc">` + `display:flex; align-items:center`，文案包 `<text>`。

---

## 2. 字体图标尺寸由 `font-size` 决定（`width/height` 无效）
**证据**：`SvgIcon.vue:80-84` 字体分支 `<text class="icon icon-xxx">`，基线 `.icon{display:inline-block;line-height:1}` 无宽高；PNG 分支 `.svg-icon-png{width:1em;height:1em}` 同样随字号。

| 场景 | H5 写法 | 小程序限制 | 修正写法 |
|---|---|---|---|
| 图标尺寸控制 | `<svg class="icon" style="width:16px;height:10px" />` | iconfont 字形大小只受 `font-size` 影响，`width/height` 只改盒子、不改字形 | **标签级 `class` + `font-size`**（宿主节点字号即图标边长，两分支都是 1em） |

**本项目契约**：见 `SvgIcon.vue:16-28`「调用方样式契约」；`ProfileCard.vue:110-115` `.icon_mobile{font-size:32rpx}`、`CartStoreCard.vue:133` `.store-arrow{font-size:32rpx}`、`BackTop.vue:97` `.back-top-icon{font-size:40rpx}`。

---

## 2.1. 小程序不支持 `<svg>`，替代方案对比
**证据**：`SvgIcon.vue:6-11` 注释；`scripts/generate-iconfont.mjs` / `scripts/generate-multicolor-png.mjs` 两条生成管线。

| 方案 | 原理 | 适用场景 | 本项目采用 |
|---|---|---|---|
| **iconfont 字体** | SVG → TTF/WOFF2 → `@font-face` + `<text class="icon icon-xxx">` | 单色图标、需动态改色、体积极小 | ✅ **主力**（38 个单色，TTF base64 内联进 `elm-iconfont.css`） |
| **PNG 兜底** | 多色 SVG 导出 PNG → `<image src="/static/icons-xxx.png" />` | 多色、渐变、描边等字体无法表达的效果 | ✅ **补位**（3 个多色：`fengniao` `cart-icon` `sdk_icon_zhifubao`） |
| **Canvas 绘制** | `<canvas type="2d">` 用 JS 画路径 | 极复杂动态图标、动画 | ❌ 未用（维护成本高） |

**关键点**：
- 字体方案：**尺寸只能用 `font-size`**，`width/height` 无效（见第 2 条）
- 多色图标**必须走 PNG**，字体会丢色（见 `SvgIcon.vue:55` `MULTICOLOR_ICONS` 判断逻辑）
- TTF 必须 **base64 内联进 CSS**，小程序 `@font-face` 不支持本地文件路径（007 坑 7）

---

## 3. 样式穿透失效（`icon-class` 落在内部节点 + scope id 缺失 + 默认 isolated）
**证据**：编译产物 `ProfileCard.wxml` 宿主节点 `<svg-icon class="data-v-xxx">` 有 scope id，内部 `<text class="{{d}}">` 无 scope id；调用方规则编译为 `.icon_mobile.data-v-xxx` 永不可能匹配；`SvgIcon.json` 无 `styleIsolation` → 默认 `isolated`。

| 场景 | H5 写法 | 小程序限制 | 修正写法 |
|---|---|---|---|
| 父组件给子组件内部节点加样式 | `:deep(.icon) { width: 20px }` | 子组件内部节点无父 scope id + 默认 isolated | **标签级 `class` + `font-size`**（宿主节点有父 scope id → 规则能命中；`font-size` 再继承进内部节点） |

**本项目已否决的方案**：`virtualHost: true` + `manifest.json mergeVirtualHostAttributes`（三条否决理由见 007 坑 18）。

---

## 4. `icon-class` 只做语义标记，禁止承载样式
**证据**：`SvgIcon.vue:22-25` 契约明确；`ProfileCard.vue:50` `class="icon_mobile"`（标签级）生效，`icon-class` 只作语义保留。

| 场景 | H5 写法 | 小程序限制 | 修正写法 |
|---|---|---|---|
| 传类名控制图标样式 | `<SvgIcon icon-class="icon_mobile" />` | `icon-class` 落在内部 `<text>/<image>`，scoped 规则永远匹配不上 | 尺寸走 **标签级 `class` + `font-size`**，颜色走 `color` prop，**`icon-class` 只作语义标记** |

---

## 5. 组件库 API 差异（Vant → uni 原生/uni-ui）
| 场景 | H5 (Vant) | 小程序 (uni 原生/uni-ui) | 封装位置 |
|---|---|---|---|
| Toast | `Toast('text')` | `uni.showToast({ title: 'text', icon: 'none' })` | `platform/feedback.ts → showToast()` |
| Dialog/Confirm | `Dialog.confirm({...})` | `uni.showModal({...})` | `platform/feedback.ts → showConfirm()` |
| Loading | `Toast.loading({ forbidClick: true })` | `uni.showLoading({ mask: true })` | `platform/feedback.ts → showLoading()/hideLoading()` |
| 图片懒加载 | `<img v-lazy />` | `<image lazy-load />` | 直接写模板 |
| 长列表触底 | `IntersectionObserver` | `scroll-view @scrolltolower` + `lower-threshold` | `composables/useInfiniteScroll.ts` |

---

## 6. 事件修饰符差异
| H5 | 小程序 | 备注 |
|---|---|---|
| `@click.stop` | `@tap.stop` | 小程序无 click，统一用 `tap` |
| `@click.prevent` | 无对应 | 小程序无默认行为可 prevent，直接写业务逻辑 |
| `@keyup.enter` | `@confirm` (input) | input 回车触发 `confirm` 事件 |

---

## 7. 生命周期差异
| H5 (Vue 3) | 小程序 (uni-app) | 备注 |
|---|---|---|
| `onMounted` | `onMounted` + `onLoad` | 页面数据建议在 `onLoad` 取，组件通用逻辑用 `onMounted` |
| `onUnmounted` | `onUnmounted` + `onUnload` | 页面清理用 `onUnload` |
| `onActivated` / `onDeactivated` | 无 | 小程序页面栈管理不同，`keep-alive` 语义不同 |

---

## 8. 样式单位与全局变量
| 项 | H5 | 小程序 | 约定 |
|---|---|---|---|
| 单位 | `px` / `rem` | `rpx` (设计稿 750 宽) | `px → rpx` 手工换算，`@include wh(px,px)` mixin 自动转 |
| 颜色变量 | CSS var `--color-xxx` | SCSS 变量 `$color-xxx` | 全量迁移到 `variables.scss` |
| 全局样式注入 | `vite.config.ts` `additionalData` | 同，但 `@use` 而非 `@import` | `additionalData: '@use "@/assets/styles/variables.scss" as *; @use "@/assets/styles/mixins.scss" as *;'` |

---

## 9. 易混淆的原生标签映射
| H5 | 小程序 | 备注 |
|---|---|---|
| `<div>` | `<view>` | 块级容器 |
| `<span>` | `<text>` | **仅文本**，不可嵌套组件 |
| `<img>` | `<image>` | 必加 `mode="aspectFit|aspectFill|widthFix"` |
| `<a>` | `<navigator>` | 页面跳转 |
| `<input>` | `<input>` | 事件 `@input` → `@input` / `@confirm` |
| `<ul>/<li>` | `<view>` + 循环 | 无语义标签 |

---

## 10. 易踩的编译/运行时坑
| 坑 | 现象 | 根因 | 规避 |
|---|---|---|---|
| `package.json` 写 `"type": "module"` | `uni is not a function` | `@dcloudio/vite-plugin-uni` 是 CJS | **禁用** `"type": "module"`（007 坑 1） |
| SCSS partial 用 `_mixins.scss` | `Cannot find module '_mixins.scss'` | uni-app customResolver 不认下划线 | 命名 `mixins.scss` 无下划线（007 坑 2） |
| `@import` 而非 `@use` | Dart Sass 废弃警告 | Dart Sass 3.0 移除 `@import` | 统一 `@use "..." as *;`（007 坑 3） |
| `vitest.config.ts` 复用 `vite.config.ts` | 测试跑起 uni 编译流程 | 插件被加载 | **必须独立**，且 `passWithNoTests: true`、`environment: 'node'`（007 坑 4） |
| easycom 不识别非同名组件 | 组件不自动导入 | 只认 `components/组件名/组件名.vue` | `pages.json easycom.custom` 补映射（007 坑 15） |
| `useTemplateRef` 报错 | `useTemplateRef is not a function` | Vue 3.5 API，项目锁 3.4.21 | 改 `ref` + 模板 ref（007 坑 10） |
| `<image>` 写 `alt` | 属性无效 | 小程序无 alt | 无障碍用 `aria-label`（007 坑 11） |
| stylelint 报 `rpx` 未知单位 | 750 个 `unit-no-unknown` error，pre-commit 直接失败 | stylelint 默认单位表只认 CSS 规范单位，不认小程序响应式单位 | 根 `stylelint.config.mjs` 的 `unit-no-unknown` 加 `ignoreUnits: ['rpx']`（对 H5 两端 no-op，它们全用 px） |
| stylelint 报 `page`/`swiper` 未知选择器 | `selector-type-no-unknown` error | 小程序原生标签不在 HTML 标签表里 | `ignoreTypes` 只列**实际用到的**三个；刻意不预先放行 `view`/`text`/`image`，否则会掩盖 H5 端真实拼写错误（007 坑 22 同批处理） |
| ★ stylelint `--fix` 把 `@media` 搬到基础规则之前 | **三项校验全绿**，但小屏适配静默失效、PoC 断点探针恒显绿色（→ C4 假结论） | 根配置 `order/order` 含 `at-rules`（要求 at-rule 前置），而**at-rule 位置在 CSS 里有语义**：特异性相同时只按源码顺序决胜，简写 `padding` 反向重置了长写 `padding-inline` | `order/order` 删掉 `at-rules`；`@media` 一律写在被覆盖的基础规则**之后**；验收要到 `.wxss` 产物用 `grep -bo` 比字节偏移（007 坑 22，含完整推导） |
| `svgtofont` 生成的 css 被 `--fix` 改写 | 每次「生成 ↔ 提交」来回翻烧饼 | `--fix` 把 `font-family: "elm-iconfont"` 改成不带引号，重跑生成脚本又写回带引号 | 根 stylelint 的 `ignoreFiles` 排除 `apps/uni-user/src/static/iconfont/elm-iconfont.css`（产物不参与 lint） |
| ★ 组件用了却没注册 `usingComponents` | 图片/子组件**整个不渲染**，但 build / vue-tsc / eslint **全绿** | uni-app 只对「同名同路径」的组件做 easycom 自动导入；`SmartImage` 在 `components/common/SmartImage/`，不符 `components/组件名/组件名.vue` 约定 → 自动扫描不命中 | `pages.json` 的 `easycom.custom` 加 `"^SmartImage$": "@/components/common/SmartImage/SmartImage.vue"`。**验收看产物 json**：`grep smart-image "dist/build/mp-weixin/**/*.json"`（2026-10-16 shop 页坐实，图片全白） |
| ★ `image_path` 里的 `blob:` / `localhost` 脏值 | 部分图恒显示占位图或破图 | 上游 seed 数据混入浏览器会话级对象 URL（`blob:http://localhost:8002/xxx`，`restaurant_id=1` 菜单里实测 **50 条**）；`blob:` 离开原页面即永久失效，任何端都取不到 | `config/index.ts` 的 `isUnusableImagePath()` 显式判掉 `blob:` / `filesystem:` / `localhost` / `"null"` 字面量 → 走 `DEFAULT_RESTAURANT_IMAGE`。⚠️ 不能靠「请求失败再回退」：`IMAGE_ORIGIN_FALLBACKS` 刻意留空 → 失败只会显示「加载失败」破图，不会自动换占位图（2026-10-19 坐实；2026-11-06 候选回退整套删除，SmartImage 已无失败回退） |
| ★ 构建目标与调试目标不一致 → 全站图片/请求失败 | 页面数据能渲染（命中过缓存或另一产物），但图片全白 | `pnpm build` 读 `.env.production`（`VITE_API_BASE_URL` **刻意注释掉**）→ 回退到代码里的 `https://elm-platform.onrender.com/api`；而 `pnpm dev` 读 `.env.development` → `http://127.0.0.1:3000/api`。**两个产物的图片域名不同** | 连本地后端调试要导入 **`dist/dev/mp-weixin`**（`pnpm dev:mp-weixin`），不是 `dist/build/mp-weixin`。验收：`grep -o "127.0.0.1:3000\|onrender" dist/*/mp-weixin/config/index.js`（2026-10-19 坐实） |

---

## 10.1. `v-show` 失效：被编译成低权重 `hidden`，被自定义 `display:flex` 覆盖
**证据**：`BackTop.wxml:1` 产物 `<view hidden="{{!b}}" class="back-top ...">`（`b = show`）；`BackTop.vue:82` `.back-top{display:flex}`；现象 = msite 未滚动时 BackTop 圆圈仍一直显示。

| 项 | H5 | 小程序（uni-app 编译后） | 后果 |
|---|---|---|---|
| `v-show` 底层 | 内联 `style="display:none"`，权重高 | 注入 `hidden` 属性 + 全局选择器 `wx-view[hidden]{display:none}`，**权重极低** | 自定义类写了 `display:flex/block/grid` 时**覆盖** `display:none` → 元素照常显示 |
| 显隐控制 | `v-show` 即可 | `v-show` 在「自带 display 布局的元素」上不可靠 | 改用下方修正写法 |

**修正写法（按推荐度）**：
1. **`v-if`**（销毁/重建，最可靠）：显隐频率低时用。可写子组件根节点，或**上提父组件**（父级 `<BackTop v-if="scrollTop > 400">`，子组件删掉 show 逻辑）。
2. **加权重兜底**：`.back-top[hidden]{display:none !important}`（保留 `v-show` 时）。
3. **不用 hidden，改用透明度**：`opacity:0 + pointer-events:none`（保留 flex 居中，还能白捡淡入淡出动画）。

**注意**：`v-show` 编译成 `hidden`，所以「改用 v-show」**不是**解法（它正是病根）。H5 同理 `display:flex` 也会覆盖 `hidden`，并非小程序独有问题，只是小程序里 `v-show` 一律走 `hidden` 而更容易踩。

**已修两处（2026-10-16 shop 重设计时坐实）**：`BaseState.vue` 的 `.state-overlay`（success 态下白罩常显、盖住整页）、`pkg-shop/shop.vue` 的 `.menu-area`（切评价 tab 时点菜区不隐藏）。规律：**只要「scoped 类写了 display:flex/grid」+「用 v-show 控制」同现，就必须补 `[hidden]{display:none!important}`**（007 坑 21）。

---

## 10.2. 自定义组件宿主节点高度 `auto` → 插槽内容高度链断掉，页面「滚不动」
**证据**：`BaseState.wxml` 产物根节点 `class="{{['state-container', ...]}}"` 无内联高度；`BaseState.wxss` 仅 `state-container{position:relative}` 与 `state-container.is-active{min-height:240rpx}`，而 `is-active` 的启用条件是 `state !== ''` → **success 态下整条高度链无从计算**。

| 项 | H5 | 小程序（uni-app 编译后） | 后果 |
|---|---|---|---|
| 组件宿主节点 | 就是普通 DOM 节点，`flex:1` / `height:100%` 直接生效 | 宿主节点是独立节点；塞进 `slot` 的内容若依赖 `height:100%`，会落在一个 `height:auto` 的宿主上 | 内层 `scroll-view{height:100%}` 失去参照 → **内容不可滚动** |
| 跨组件传高度 | 父子同一渲染上下文 | 宿主节点样式由组件自己的 wxss 决定，父页面的 class 不天然生效 | 父页面写 `.xxx{flex:1}` 想撑开插槽内容，常常无效 |

**修正**：**别把「需要撑满高度」的布局塞进自定义组件的插槽**。两条路——
1. **首选**：布局留在页面自己的节点上（根 `height:100vh + flex column`，中间层 `flex:1 + min-height:0`），状态遮罩改成**兄弟节点绝对定位**（`position:absolute; inset:0`）。
2. 给组件根节点显式 `flex:1`/`height:100%`（改的是公共组件，影响所有调用方，慎用）。

**验收要到产物 wxss 核完整链**：`.page{height:100vh;display:flex;flex-direction:column}` → `.body{flex:1;min-height:0;display:flex;flex-direction:column}` → `.content{flex:1;min-height:0}` → `.scroll{height:100%}`，缺一环则滚动失效（2026-10-16 shop 页坐实）。

---

## 10.3. `uni.addInterceptor` 的 `invoke` 必须返回 `false` 才叫「拦住」
**证据**（当前安装的 `@dcloudio/uni-mp-weixin` 源码，不是推测）：
- `dist/uni.api.esm.js:243-269` 的 `queue()`：遍历 hooks 时只要某个 `invoke` 返回 `false`，立即 `return { then(){}, catch(){} }`（空 thenable）。
- `dist/uni.api.esm.js:316-324` 的 `invokeApi()`：只有 `res.then(options => api(...))` 里才会调用底层 API；拿到空 thenable 就**根本不调**。

| 项 | H5（vue-router） | 小程序（uni.addInterceptor） | 后果 |
|---|---|---|---|
| 中止导航 | `beforeEach` 里 `next(false)` / 返回 false | `invoke` 返回 `false`；返回 `args` 表示放行 | 照 H5 习惯写成「自己在 guard 里跳转，然后 return args」→ **原跳转照样执行**，被拦下的目标页立刻盖掉刚压栈的登录页，`redirect` 形同虚设，而且不报错 |
| 正确写法 | — | `return guard(url) ? args : false` | 登录页成为栈顶，`redirect` 参数保住 |

**本项目**：`platform/navigation.ts` 的 `registerNavigationGuards()`。2026-11-11 修复前就是「总是 return args」。按上面两段源码推导，未登录点商家时：guard 先跳登录，随后被拦下的原 `navigateTo` 仍会执行，登录页被商家页盖掉；商家页需鉴权、请求 401，表现为「登录页一闪、停在无数据页」，且不报错。
⚠️ 拦截器同样包住 `guard()` 内部自己发起的 `redirectTo`/`reLaunch`，所以登录页 URL 必须能通过 guard（`/pkg-auth/*` 不在 `REQUIRES_AUTH_PAGES`），否则会自己拦自己。
**验证边界**：`invoke` 返回值已由 `platform/navigation.test.js` 锁定；本轮模拟器因 `appid=touristappid` 返回 `APPID_ERROR`，未做实机验收。

---

## 10.3. `scroll-into-view` 同值不再触发（连点同一分类第二次失效）
**证据**：`pkg-shop/shop.vue` 的 `onCategorySelect`；现象 = 第一次点分类能跳，连点第二次不动。

| 项 | 行为 | 说明 |
|---|---|---|
| `scroll-into-view` 触发条件 | 绑定值相对**上一次渲染**发生变化 | 值相同视为无变化，不滚动 |
| `nextTick` 里「先清空再赋值」 | **不够** | 两次写在同一渲染周期会被合并成一次提交，观察到的值没变过 |
| 正确做法 | 用 `setTimeout(0)` 隔开两拍 | 让空值真正提交一次渲染，下个值与之必然不同 |

**修正**：见 `pkg-shop/shop.vue` 的 `onCategorySelect` —— 第 1 拍清空，第 2 拍（`setTimeout(0)`）赋 `food-cat-<id>`。

⚠️ 另一条易误判的：**`id` 必须打在滚动容器的直接子节点上**。本项目 `id` 落在 `<scroll-view>` 内层的 `.food-category`（中间只隔 `wx:for` 模板层，不算额外节点），产物核对过是正确的 —— 排查「跳不动」时别先怀疑 id 位置。

---

## 10.4. 原生图片懒加载与 JS 并发队列叠加 → 无请求、骨架屏不退出

**证据**：`apps/uni-user/src/utils/image/extras/imageLoadScheduler.js:13-29` 保留的旧队列在 run 前占名额，仅由 release 归还；旧 SmartImage 在 run 中绑定 src，在 load/error 中 release。已用旧调度器复现「6 个不触发事件的任务占槽，后续头图不执行」。修复后 `SmartImage.vue:66-86` 直接绑定 src，`:126` 将 lazy-load 绑定为 `!eager`；开发产物 `SmartImage.js:89` 为 `g: !__props.eager`，`SmartImage.wxml:1` 为 `lazy-load="{{g}}"`。JS 验证不等于已验收微信原生可见性/网络。

| 项 | H5（本项目 web-user） | 小程序（旧 uni-user） | 修正 |
|---|---|---|---|
| 入 JS 队列时机 | Observer 判断可见、停留后入队 | 不判断可见，延迟后所有图入队 | uni-user 不使用 JS 图片队列，直接交给原生 lazy-load |
| 绑定 src 与下载 | 普通 img 赋 src 后开始下载 | 原生 lazy-load 可能仍等可见，不发请求、无 load/error | 不为等待原生可见性的图片提前占并发槽 |
| 全局堵塞 | 已发请求完成后能释放名额 | 6 张离屏/隐藏图占满后，后续图片连 src 都拿不到 | 原生调度与组件加载状态分离，无跨实例名额依赖 |
| 首屏 eager | uni-user 特有 prop，不套用 H5 | 只跳过延迟，仍排队且 lazy-load 恒开启 | 跳过延迟 + `:lazy-load="!eager"` |

**排查重点**：不仅检查当前页。navigateTo 后上一页实例仍可能存活，shop 的评价列表通过 v-show 隐藏，也可能持有等待可见的图片。此处说明的是可造成堵塞的代码路径，不是声称已观测到某一实例占槽。

**留档**：旧队列已移到 `src/utils/image/extras/imageLoadScheduler.js`，仅供研究/未来重新设计，未接入生产产物。启用前提见 [014](014-uni-user-image-scheduler-extras.md)。重要约束见 007 坑 27。不要通过加大并发数、给 eager 加优先级或超时释放槽来掩盖调度职责冲突。

---

## 10.5. 分类分页改变高度：固定图片尺寸不再足以保证滚动锚点有效

**证据（2026-11-08；2026-11-11 更新组件位置）**：H5 `ProductList.vue:26-49` 观察分类页尾并按当前分类索引限制向上预取；小程序 `pkg-shop/components/ShopMenu.vue:87-141` 一次查询容器、分类块、页尾，分页后通过 watch + nextTick 重测，滚动路径复用缓存；这段代码原位于 `shop.vue:151-200`。H5 本地浏览器验收曾出现跳分类后上方占位块补载把目标挤下去，限制向上预取后目标对齐吸顶下沿；小程序仅完成源码检查、类型检查和微信构建，尚未真机验收。

| 场景 | H5 | 小程序 | 本项目处理 |
|---|---|---|---|
| 分类即将可见/页尾接近视口 | DOM `IntersectionObserver` 可自动更新位置 | 不能直接使用 DOM Observer；本页延用 selector query + 位置缓存 | H5 观察页尾；小程序缓存页尾 top/bottom 与容器高度 |
| 菜品分页追加 | Observer 随布局变化重新检测 | 上一页缓存的分类偏移会过时 | 菜单数组替换后 nextTick 批量重测，不仅在最初加载时测一次 |
| 点击远分类 | DOM 位置在追加后改变 | scroll-into-view 目标位置同样会被上方内容撑开 | 点击前取目标第一页；不补载目标上方的占位块，向上滚时再加载 |
| 页隐藏/销毁 | tab 卸载时断开 Observer | v-show 隐藏时量不到真实尺寸；查询回调异步返回 | 切回点菜再测；查询序号与 disposed 拒绝过期回调 |

**勿误修**：不要每个 scroll 事件都发一次异步查节点，也不要以为固定图片宽高能覆盖分页追加。H5 可见内容边界含 50px 导航 + 42px tab，小程序 tab 在 scroll-view 外，两端不能共用同一个 92px 偏移。契约与验收步骤见 [015](015-menu-category-lazy-pagination.md)，重要约束同步 007 坑 28。

---

## 10.6. 表单输入属性要显式绑定，不照搬 H5 的对象式 `v-bind`

**证据（2026-11-11）**：FormInput 加入 `v-bind="$attrs"` 后，`pnpm --filter @elm-platform/uni-user run build:mp-weixin` 报 `[vite:vue] v-bind="" is not supported.`；去掉对象式绑定后构建通过。最终 `pkg-profile/components/FormInput.vue:4-5` 保持显式参数边界，`:maxlength` 绑定位于第 60 行；`dist/build/mp-weixin/pkg-profile/components/FormInput.js:1` 保留默认 `-1`，`FormInput.json:3` 的 usingComponents 为空，不再依赖旧布局组件。

| 场景 | H5 当前实现 | 小程序本次处理 | 验证范围 |
|---|---|---|---|
| 额外 input 属性 | web-user 的 FormInput 用 `v-bind="$attrs"` | 当前编译器不支持对象式 v-bind；参数必须声明并逐项绑定 | 对象式写法构建失败、显式写法构建通过，未承诺未来版本也不支持 |
| 不传 maxlength | 旧同源组件只有 `maxlength: Number`，仍绑定到 input | 组件默认 `-1`，页面给出 `20/120/120/11/11` | 源码和编译产物已核对；空值是否按 0 处理及原生输入效果尚未人工实测 |
| 标题与错误提示 | 独立 FormItemWrapper 包装 input | 地址页当前只有一种活跃输入控件，布局内联 | 编译产物为 view + input，无旧组件引用 |

**勿误修**：不要把 DOM 中的属性省略规则直接套到小程序动态绑定上；也不要为方便透传添加未经使用的 focus/confirm-type 参数。当前原生输入事件从 `event.detail.value` 取值，组件先回填 v-model，再发送字符串 input 通知。留档接入与人工验收见 [018](018-uni-user-address-form-extras.md)，编译约束同步 007 坑 29。

---

### 维护规则
1. **遇到新坑 → 当场追加一行**（表格 + 证据行号），别事后补
2. 重要坑（影响面广/易反复踩）同步到 `007-uniapp-uni-user-constraints.md`「新发现的坑」编号
3. 证据必须可追溯：`文件:行号`、`dist/...wxml:片段`、编译器源码路径
4. 本文件只记「差异/坑」，不记业务逻辑
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

---

### 维护规则
1. **遇到新坑 → 当场追加一行**（表格 + 证据行号），别事后补
2. 重要坑（影响面广/易反复踩）同步到 `007-uniapp-uni-user-constraints.md`「新发现的坑」编号
3. 证据必须可追溯：`文件:行号`、`dist/...wxml:片段`、编译器源码路径
4. 本文件只记「差异/坑」，不记业务逻辑
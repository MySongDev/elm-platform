# 013 - uni-user 自定义蓝色 Head 组件（导航统一后留档）

> 状态：**未接入应用**（死代码留档）
> 代码：`apps/uni-user/src/components/extras/head.vue`
> 落档日期：2026-11-07

## 这是什么

uni-user 里曾有一套**自定义蓝色头部**组件（`src/components/header/head.vue`，蓝底、白字、自带返回按钮 + 中间 `headTitle` 文字）。它服务的对象是「需要自画导航头」的页面，与原生导航栏**并排出现**时就成了双头栏。

它和原生导航栏的能力重叠：

| 能力 | 蓝色 Head（本组件） | 原生导航栏 |
| --- | --- | --- |
| 返回按钮 | 自画 `arrow-left`（`navigateBack`） | 微信原生 ← |
| 页面标题 | `headTitle` prop（`.title_text`） | `pages.json` 的 `navigationBarTitleText` |
| 状态栏避让 | 手动 `statusBarHeight` 占位 | 微信自动处理 |

## 为什么现在不在主链路里

2026-11-07 把 uni-user 导航**统一走原生导航栏**（返回按钮 + 标题都用微信自带，参考页 `pkg-profile/addressHome.vue`），本组件的三个引用方全部拆除：

| 页面 | 原用法 | 现状 |
| --- | --- | --- |
| `pkg-order/payment.vue` | `<Head head-title="在线支付" theme="light" />`（与原生栏双头） | 移除，标题走 `navigationBarTitleText` |
| `pkg-order/PaymentResult.vue` | `<Head head-title="支付结果" theme="light" />`（双头） | 同上 |
| `pkg-profile/AddressDatil.vue` | `<Head head-title="搜索地址" theme="light" />`（双头） | 同上，本页变纯空壳 |

同时 `pkg-shop/shop.vue` 的自画 `.shop-nav` 返回条也拆了，`pages.json` 里 shop 的 `navigationStyle: custom` 改为原生栏。

拆除后本组件**零引用**，按「死代码留档而非删除」策略从 `src/components/header/` 迁到 `src/components/extras/`。

> ⚠️ 注意：uni-user 里**仍有**真正需要自定义头的页面——`pages/profile/profile`（tabBar 页，`navigationStyle: custom`，用 `ProfileCard` 的蓝色卡片当视觉头）。那是「自画整块头」而非「自画导航条」，与本组件不是同一套东西，本次未动它。

## 机制要点（读代码前先看这个）

1. **状态栏避让是本组件存在的唯一理由之一**。`uni.getSystemInfoSync().statusBarHeight` 在 script 里取一次（不每次重渲染取），再 `:style="{ paddingTop }` 让出占位——因为 custom 导航页的 webview 顶到屏幕最上角，不避让就会和微信状态栏/胶囊重叠。
2. **返回走 `navigateBack()`**，内部已处理「栈底（tabBar 页）调用会失败 → 降级 `switchTab`」的坑（见 `platform/navigation.ts`）。
3. **中间标题只认 `headTitle` prop**——小程序没有 `route.meta`，原生栏的标题是 `pages.json` 静态配的，组件这边是动态传的。
4. **`noBackPages` 白名单**列了 tabBar 路径（msite/SearchHome/cart/profile），这些页不画返回按钮（tabBar 页无「返回」语义）。

## 如何重新接入

按下面 3 处改回去（顺序即执行顺序）：

**1. 把文件挪回原位**（或就地 import 也行，uni-app 不强制组件目录）

```bash
git mv apps/uni-user/src/components/extras/head.vue apps/uni-user/src/components/header/head.vue
```

**2. 目标页 import + 用**

```vue
<script setup>
import Head from '@/components/header/head.vue'
</script>

<template>
  <Head head-title="在线支付" theme="light" />
</template>
```

**3. 目标页在 `pages.json` 里改回 `navigationStyle: "custom"`**（否则原生栏 + 蓝色 Head 又会双头）

```json
{ "path": "payment", "style": { "navigationStyle": "custom" } }
```

> 第 3 步是关键：只 import 组件、不改 `pages.json`，会重演这次拆掉的双头栏。

## 什么时候不该用这套

如果只是想「页面有标题、有返回」，**直接用原生导航栏就够了**（`pages.json` 配 `navigationBarTitleText`，返回按钮微信自带），这也是本项目的默认约定。只有当页面需要「自画一整块带品牌色的头」（如 profile 的 ProfileCard）时才绕开原生栏，而那种场景是自画整块 UI、不是复用本组件这条导航条。

本组件的价值在**教学与备选**：它是「custom 导航页怎么避让状态栏 + 收口返回」的参照实现。

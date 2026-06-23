# Loading Architecture

本项目把加载反馈分成三层，避免所有请求都用一个全屏遮罩，也避免每个页面各写一套临时 loading。

## 1. 全局 Loading

适用场景：

- 登录、提交表单、支付、保存资料等会阻塞用户继续操作的请求
- 页面级关键请求，用户必须等待结果才能继续

实现：

- `src/stores/modules/store-loading.js` 统一管理并发计数、延迟展示和最短展示时长
- `src/components/common/GlobalLoading/GlobalLoading.vue` 只负责渲染全屏反馈
- `src/services/http/http.js` 默认接入全局 loading，可通过请求配置关闭

使用方式：

```js
get('/api/list', params)
post('/api/save', payload, { loadingText: '保存中...' })
get('/api/list', params, { loading: false })
```

## 2. 骨架屏

适用场景：

- 首屏列表
- 详情页主体区域
- 用户更关心页面结构稳定性，而不是被遮罩打断

实现：

- `src/components/common/Skeleton/SkeletonBlock.vue` 是通用骨架块，负责 shimmer 和尺寸控制
- `src/components/common/Skeleton/ShopListSkeleton.vue` 是商家列表专用骨架屏
- `src/views/shop/components/ShopSkeleton/ShopPageSkeleton.vue` 是店铺详情页业务骨架屏
- `ShopList` 在 `loading && list.length === 0` 时自动显示骨架屏
- 分页加载时不显示骨架屏，只在底部显示局部加载

## 3. 局部 Loading

适用场景：

- 局部卡片、评论区、筛选结果、弹窗内容
- 页面其它部分仍可浏览或操作

实现：

- `src/components/common/Loading/LocalLoading.vue` 提供统一块级 loading
- `BaseState` 默认加载态复用 `LocalLoading`
- 复杂组件可以继续使用业务骨架屏，例如评论列表和 ShopList

## 约定

- 默认接口请求会触发全局 loading，但列表首屏这类场景应显式传 `{ loading: false }`，由组件骨架屏承接。
- 全局 loading 只解决“阻塞级等待”；局部 loading 和骨架屏解决“内容级等待”。
- 组件通过 props 接收 `loading`，不要在展示组件内部直接请求接口。
- 不在页面里重复写 spinner 样式，优先复用 `LocalLoading` 或业务 skeleton。

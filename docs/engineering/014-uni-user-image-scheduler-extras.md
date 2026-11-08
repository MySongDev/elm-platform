# 014 - uni-user 图片调度器留档与重新启用约束

> 日期：2026-11-08。仅适用于 `apps/uni-user`；web-user 的队列仍在主链路中。
> 留档文件：`apps/uni-user/src/utils/image/extras/imageLoadScheduler.js`。

## 1. 功能清单

| 功能 | 实现位置 | 说明 |
|---|---|---|
| 原生懒加载（当前主链路） | `components/common/SmartImage/SmartImage.vue` | 普通图延迟绑定 src 后由原生 lazy-load 决定何时下载；不使用 JS 并发名额 |
| 首屏立即加载（当前主链路） | `SmartImage.vue` 的 `eager` | 跳过 loadDelay，并将 lazy-load 设为 false；ShopHeader 已使用 |
| 先进先出排队（留档） | `extras/imageLoadScheduler.js` 的 `scheduleImageTask()` | 插入任务后尝试执行；当前没有业务调用方 |
| 并发名额（留档） | `pump()` 的 `active` / `maxConcurrent` | 保留旧值 6，调用方必须通过 release 归还；不再从全局 config 读取配置 |
| 幂等归还（留档） | `release()` | 重复调用只归还一次；归还后继续执行队列 |
| 撤销排队（留档） | 返回句柄的 `cancel()` | 只撤销尚未开始的任务，不会中止网络请求或替运行中的任务归还名额 |

## 2. 为什么退出主链路

旧 uni-user SmartImage 同时用了两套调度：

1. 所有实例延迟后入 JS 队列，取得名额才赋 src。
2. 原生 `<image lazy-load>` 再判断可见性，可能暂不下载。
3. 只有 load/error 才释放 JS 名额。

这让「等待可见」的图片也算成「正在下载」。只要 6 张图不触发 load/error，第 7 张及以后的图就连 src 都拿不到。上一页仍在页面栈中、评价区被 v-show 隐藏，都是可能出现等待任务的场景；不需要服务器真的收到 6 个请求。

旧 eager 只跳过延迟，不绕过队列，模板也始终开启 lazy-load，因此头图同样会被挡住。

已用队列代码验证 6 个不结算任务能够挡住后续头图；用新开发编译产物验证 20 个未结算普通图不再阻塞 eager 头图。**这是 JS 机制验证，不是微信原生网络和真机验收。**

## 3. 当前方案的边界

```vue
<image
  v-if="!failed && currentSrc"
  :src="currentSrc"
  :lazy-load="!eager"
  @load="settle(true)"
  @error="settle(false)"
/>
```

这段的论点是「原生决定下载时机，组件只展示加载结果」。它消除了跨实例的 JS 名额依赖；type-check/build 能检查绑定和编译，却不能保证网络可达或原生可见性判断正确。

- loadDelay 是绑定 src 前的错峰时间，不是停留检测。
- 不再承诺最多 6 张图片下载；并发由小程序运行时处理。
- 没有源站回退、下载超时或主动中止原生请求。
- 离屏图等待可见是正常懒加载；首屏可见图始终不请求才需要继续排查。
- 有请求但图片失败时，继续检查 URL、服务器、域名白名单；队列修复不会解决这些问题。
- web-user 先判断可见后入队，运行机制不同，不应同步撤下队列。

## 4. 如果未来确实需要重新引入 JS 并发控制

**不能只把 import 加回来。** 先证明原生调度不足，记录目标页面、图片数量及请求峰值；再满足以下前提。

### 路线 A：关闭原生 lazy-load，自行处理可见性

1. 在组件挂载后用小程序 `uni.createIntersectionObserver` 等原生接口观察图片容器；这不是浏览器 IntersectionObserver 的直接复制。
2. 只有判断到可见、满足必要停留时间后才入队；离开时撤掉仍在排队的任务。
3. 获得名额时再绑定 src，同时关闭原生 lazy-load：

```vue
<!-- 前提：调用方已经完成可见性判断，不能让原生再等一次。 -->
<image :src="currentSrc" :lazy-load="false" />
```

这段只解决双重可见性等待，不解决卸载、换源、事件过期或容器查询作用域问题。它不能脱离第 1、2 步单独应用，否则会退化成整页图片全部下载。

4. 到这一步才允许引用留档 API：

```js
import { scheduleImageTask } from '@/utils/image/extras/imageLoadScheduler'
```

引用仅代表重新使用队列，不代表可见性和生命周期管理已实现。

5. load/error 必须释放当前任务；换源、卸载、废弃运行任务时同样释放，不能只调用 cancel。需要给加载轮次绑定身份，避免旧事件结算新任务。
6. 验证首页长列表、navigateTo 后旧页面存活、隐藏评价区、滚动进出、换店、请求失败和卸载。

### 路线 B：仅控制明确开始的下载任务

若控制的是显式下载 API，而非原生 image 的等待状态，应围绕其开始/完成/失败/取消语义重新设计。不要把「绑定 src」误当成「网络已经开始」。这会引入额外下载与本地路径管理，当前无需求，不实施。

### 不采用的补丁

- 加大并发数：只把堵塞门槛从 6 推迟到更大的数。
- 给 eager 加优先级：已经运行的任务不释放，优先级也无法抢出名额。
- 超时归还槽：任务超时归还后原生仍可能开始下载，JS 计数不再等于真实并发。

## 5. 验证命令与人工检查

```bash
pnpm --filter @elm-platform/uni-user run type-check
pnpm exec eslint apps/uni-user/src/components/common/SmartImage/SmartImage.vue apps/uni-user/src/config/index.ts apps/uni-user/src/utils/image/extras/imageLoadScheduler.js
pnpm --filter @elm-platform/uni-user run build:mp-weixin
```

本地后端调试使用 `dev:mp-weixin` 和 **`apps/uni-user/dist/dev/mp-weixin`**，不要因为 build 输出提示而改导入生产目录。当前源码构建后，SmartImage 的 JS 不应引用 `imageLoadScheduler`，WXML 的 lazy-load 应是动态绑定，eager 对应 false。

微信开发者工具完整重新编译后，检查头图立即请求、首屏菜品图加载、切评价再切回、滚动到后续分类、返回首页再进另一店。不要用生产构建成功代替开发工具里的这些验收。

相关文档：[012 图片懒加载](012-image-lazy-loading.md)、[迁移差异第 10.4 节](uniapp-migration-diffs.md)、[007 坑 27](007-uniapp-uni-user-constraints.md)。

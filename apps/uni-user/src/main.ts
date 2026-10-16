import { createSSRApp, watch } from 'vue'

import { CART_TAB_INDEX } from '@/config/routes'
import { showToast } from '@/platform/feedback'
import { getImageUrl } from '@/platform/image'
import { redirectToLogin, registerNavigationGuards, setAuthChecker } from '@/platform/navigation'
import { setUnauthorizedHandler } from '@/services/http/policies/auth'
import { setAlertHandler } from '@/services/http/policies/error-message'
import { pinia } from '@/stores'
import { useCartStore } from '@/stores/modules/store-cart'
import { setLoadingVisibilityHandler } from '@/stores/modules/store-loading'
import { useUserStore } from '@/stores/modules/store-user'
import { setImageUrlResolver } from '@/utils/cart'
import App from './App.vue'
// 补齐小程序缺失的 AbortController/AbortSignal（入口 import 即在任何页面 setup 前执行）。
// 否则 useLoadMore/请求去重的 `new AbortController()` 会在页面里抛 ReferenceError，
// 导致 fetchFn（如 msite 的 getShopList）在发请求前就被 reject 且静默。
import '@/platform/polyfills'

/**
 * uni-app 入口。⚠️ 用 createSSRApp 而非 createApp（uni-app 约定）。
 *
 * 本文件是所有「平台副作用注入点」的唯一接线处（迁移方案 A 节 / 议题 7 决策 2）：
 * policies 层与 store 保持端无关，uni.* 调用全部通过注入回调进来。
 * 将来加 H5/App 端时，只改这里的注入实现，不改 policies/store。
 */
export function createApp() {
  const app = createSSRApp(App)

  app.use(pinia)

  return {
    app,
  }
}

// ── 注入 1：全局错误弹窗 ──
// 替代 web-user 的 AlterTip（命令式 document.createElement 挂载 DOM，小程序端不可用）。
// policies/error-message.js 的 showAlert(message) 已改为调注入的 alertHandler。
setAlertHandler(message => showToast(message))

// ── 注入 2：401 未授权处理 ──
// 与 web-user main.js:28-37 同语义：清登录态 + 跳登录页（带 redirect 回跳）。
// ⚠️ 差异：web-user 用 router.push + router.currentRoute；小程序端用
// platform/navigation 的 redirectToLogin（内部 getCurrentPages 取栈顶路径）。
setUnauthorizedHandler(({ error }) => {
  const userStore = useUserStore(pinia)
  userStore.logout()
  redirectToLogin()
  console.warn('[main] unauthorized:', error?.message)
})

// ── 注入 3：全局 loading 遮罩 ──
// store-loading 只管状态（pendingCount/visible/text 与定时器语义），
// 遮罩的实际显示/隐藏由这里注入 uni.showLoading/hideLoading。
// ⚠️ 不能把 uni 调用写进 store，否则 store 不再端无关（双修时要改两处平台代码）。
setLoadingVisibilityHandler((visible, text) => {
  if (visible) {
    uni.showLoading({
      title: text || '加载中...',
      mask: true,
    })
  }
  else {
    uni.hideLoading()
  }
})

// ── 注入 4：鉴权检查器 ──
// platform/navigation 不直接依赖 store（保持端无关），由这里把「是否已登录」喂进去。
// ⚠️ 必须调 syncAuthSessionFromStorage() 而非直接读 isLogin：
// 登录态判据是「本地存在未过期的 refresh 会话」，而 now 基准需要显式刷新
// （store-user 的注释写明 computed 不会因时间流逝自动失效）。
setAuthChecker(() => {
  const userStore = useUserStore(pinia)
  return userStore.syncAuthSessionFromStorage()
})

// ── 注入 5：图片 URL 解析器 ──
// utils/cart.ts 的 getImageUrl 依赖改为注入（议题 7 决策 1），
// 使 cart.ts 不再 import 端相关的 config → 端无关。
// 注入 platform/image 的实现（走后端代理 GET /api/img/*）。
setImageUrlResolver(getImageUrl)

// ── 注入 6：购物车角标 ──
// 替代 web-user 的 `<van-tabbar-item :badge="totalQuantity">`（迁移方案 D 节）。
// tabBar 是原生组件，角标必须用 uni.setTabBarBadge 命令式设置。
// ⚠️ 放在 main.ts 而非 store：store-cart 保持端无关（不 import uni.*），
// 与 setAlertHandler / setLoadingVisibilityHandler 同一原则。
// ⚠️ 用 watch 而非在 addShopFood 里调：角标要覆盖全部 12 个变更入口，
// 逐点插会漏（与 store-cart 的手动持久化用 deep watch 是同一个理由）。
function applyCartBadge(quantity: number, retriesLeft = 5) {
  if (quantity > 0) {
    // 微信角标上限 99，超出显示 99+
    uni.setTabBarBadge({
      index: CART_TAB_INDEX,
      text: quantity > 99 ? '99+' : String(quantity),
      // ⚠️ 启动早期 tabBar 尚未渲染，setTabBarBadge 会 fail。
      // 重试几次覆盖「store 恢复早于 tabBar 就绪」的时序差。
      fail: () => {
        if (retriesLeft > 0) {
          // 直接把函数与参数交给定时器（e18e/prefer-timer-args），避免多分配闭包
          setTimeout(applyCartBadge, 500, quantity, retriesLeft - 1)
        }
      },
    })
  }
  else {
    uni.removeTabBarBadge({
      index: CART_TAB_INDEX,
      fail: () => {},
    })
  }
}

function setupCartBadge() {
  const cartStore = useCartStore(pinia)

  watch(
    () => cartStore.totalQuantity,
    quantity => applyCartBadge(quantity),
    { immediate: true },
  )
}

setupCartBadge()

// ── 注册路由拦截器 ──
// 替代 web-user router/index.ts 的 beforeEach 鉴权部分。
// ⚠️ switchTab 拦不住（tabBar 切换不走拦截器），需登录页另有 onShow 兜底。
registerNavigationGuards()

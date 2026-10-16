// ⚠️ 与 apps/web-user/src/views/login/useLoginSuccess.js 同源改造。
// 修改需同步两处。
//
// ★ 与 web-user 的差异（vue-router 整体作废，迁移方案 ④ 节）：
// 1. `useRoute`/`useRouter` → 小程序端没有 router；回跳目标从**当前页 onLoad options**
//    取（redirect 参数由登录入口 navigateTo 时带过来），不是 route.query。
//    useLoginSuccess 因此改成接收 options（由 login/SmsVerification 页 onLoad 解析后传入）
// 2. `recordLoginSession` → uni-user store-user 里对应的是 `recordUserInfo`
//    （同一语义：把响应里的令牌/资料落地为登录态，见 store-user.js 头部注释）
// 3. `router.replace(redirect)` → platform/navigation 的 `navigateTo` +
//    resolveLoginRedirect（自动处理 tabBar switchTab、非法回跳兜底 msite）
import { resolveLoginRedirect } from '@/config/routes'
import { navigateTo } from '@/platform/navigation'
import { useUserStore } from '@/stores/modules/store-user'

/**
 * 登录成功后的统一收尾：短信登录与密码登录共用，差异只在前面调哪个接口。
 * 仅服务 login 文件夹内的两个页面，故就近放在此处而非全局 composables。
 *
 * @param {{ redirect?: string | (() => string) }} params
 *   redirect 是当前登录页 onLoad options 里带过来的回跳目标（字符串完整路径）。
 *   允许传函数：页面里 redirect 常是响应式 ref（onLoad 后才就绪），
 *   传 `() => ref.value` 可让 completeLogin 落地时才读最新值。
 */
export function useLoginSuccess(params = {}) {
  const userStore = useUserStore()

  // 把响应里的令牌/资料落地为登录态，再跳回用户原本想去的页面
  function completeLogin(response) {
    userStore.recordUserInfo(response)
    const redirectTarget = typeof params.redirect === 'function'
      ? params.redirect()
      : params.redirect
    navigateTo(resolveLoginRedirect(redirectTarget))
  }

  return { completeLogin }
}

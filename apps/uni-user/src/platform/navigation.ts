/**
 * 平台适配收口层 —— 导航与鉴权
 *
 * 替代 web-user 的 `router/index.ts` beforeEach（364 行路由整体作废，迁移方案 ④ 节）。
 * 原 beforeEach 的三件事在小程序端的对应物：
 * | 原实现 | 本文件 |
 * |---|---|
 * | `NProgress.start()/.done()` | ❌ 作废（小程序无 DOM 进度条）；需要时用 uni.showNavigationBarLoading() |
 * | `document.title = to.meta.title` | pages.json 的 navigationBarTitleText（静态）/ setNavigationBarTitle（动态） |
 * | `requiresAuth` 校验 + resolveLoginRedirect | ✅ 本文件的 guard + 页面 onShow 兜底 |
 */

import {
  AUTH_PAGES,
  isAuthPage,
  isTabBarPage,
  requiresAuth,
  resolveLoginRedirect,
  ROUTES,
  stripQuery,
  withQuery,
} from '@/config/routes'

/** 由 main.ts 注入：判断当前是否已登录（避免本层直接依赖 store，保持端无关） */
type AuthChecker = () => boolean

let isAuthenticated: AuthChecker = () => false

export function setAuthChecker(checker: AuthChecker): void {
  isAuthenticated = checker
}

/**
 * 取当前页面路径（不含前导斜杠 → 补成绝对路径）。
 * 小程序端没有 `router.currentRoute`，只能从页面栈取栈顶。
 */
export function getCurrentPath(): string {
  const pages = getCurrentPages()
  const top = pages.at(-1)

  if (!top?.route) {
    return ''
  }
  return top.route.startsWith('/') ? top.route : `/${top.route}`
}

/** 取当前页面的完整路径（含 query），用于登录后回跳 */
export function getCurrentFullPath(): string {
  const pages = getCurrentPages()
  // ⚠️ 不用 UniApp.PageInstance：@dcloudio/types 未导出该成员（type-check 实测报 TS2694）。
  // getCurrentPages() 返回的页面实例结构不固定，这里只取需要的 route/options 两个字段。
  const top = pages.at(-1) as
    | {
      route?: string
      options?: Record<string, string>
    }
    | undefined

  if (!top?.route) {
    return ''
  }
  const path = top.route.startsWith('/') ? top.route : `/${top.route}`
  return withQuery(path, top.options ?? {})
}

/**
 * 跳登录页，带上回跳地址。
 * 对齐 web-user `router/index.ts:70-73` 的 `{ path: '/login', query: { redirect: to.fullPath } }`。
 */
export function redirectToLogin(redirect?: string): void {
  const target = redirect || getCurrentFullPath() || ROUTES.MSITE

  uni.redirectTo({
    url: withQuery(ROUTES.LOGIN, { redirect: target }),
    fail: (error) => {
      // redirectTo 失败（如页面栈已满）时退回 reLaunch，保证用户不会卡在原地
      console.error('[navigation] redirectToLogin failed, fallback to reLaunch:', error)
      uni.reLaunch({ url: withQuery(ROUTES.LOGIN, { redirect: target }) })
    },
  })
}

/**
 * 鉴权守卫。用于 uni.addInterceptor 的 invoke，也可在页面 onShow 里直接调。
 *
 * @returns true 表示放行；false 表示已拦截并跳登录（调用方应中止后续动作）
 */
export function guard(targetPath: string): boolean {
  const path = stripQuery(targetPath)

  // 已登录时访问登录相关页面 → 跳走（对齐 web-user router/index.ts:62）
  if (isAuthPage(path) && isAuthenticated()) {
    const query = parseRedirectFrom(targetPath)
    const destination = resolveLoginRedirect(query.redirect)
    navigateTo(destination, { replace: true })
    return false
  }

  if (requiresAuth(path) && !isAuthenticated()) {
    redirectToLogin(targetPath)
    return false
  }

  return true
}

/** 从完整路径里取出 redirect 参数 */
function parseRedirectFrom(fullPath: string): Record<string, string> {
  const cut = fullPath.indexOf('?')
  if (cut === -1) {
    return {}
  }
  const params = new URLSearchParams(fullPath.slice(cut + 1))
  return { redirect: params.get('redirect') ?? '' }
}

export interface NavigateOptions {
  /** 用 redirectTo 而非 navigateTo（不保留当前页，无法返回） */
  replace?: boolean
  /** 跳转成功回调 */
  success?: () => void
  /** 跳转失败回调。⚠️ 常见失败：目标是 tabBar 页却用了 navigateTo */
  fail?: (error: unknown) => void
}

/**
 * 统一跳转入口。业务代码只调这个，不直接碰 uni.navigateTo。
 *
 * ★ 关键：自动判断目标是 tabBar 页还是普通页。
 * tabBar 页**必须**用 switchTab，用 navigateTo 会直接失败（报错信息还不直观）。
 * web-user 侧用 `router.push({ name })` 不需要区分，这是范式差异，必须在这里收口。
 */
export function navigateTo(
  url: string,
  options: NavigateOptions = {},
): void {
  const path = stripQuery(url)

  if (isTabBarPage(path)) {
    // ⚠️ switchTab 不接受任何参数，带上会静默丢参
    uni.switchTab({
      url: path,
      success: options.success,
      fail: options.fail,
    })
    return
  }

  if (options.replace) {
    uni.redirectTo({
      url,
      success: options.success,
      fail: options.fail,
    })
    return
  }

  uni.navigateTo({
    url,
    success: options.success,
    fail: options.fail,
  })
}

/**
 * 返回上一页。
 * ⚠️ 方案 E 节点出的坑：首页（tabBar 页）调用 navigateBack 会失败 ——
 * 页面栈只有一层时无处可退。这里降级为 switchTab 到 msite。
 * 对应 web-user 的 `router.back()`（head.vue:56、ShopNav.vue:87、login.vue:65、404.vue:15）。
 */
export function navigateBack(delta = 1): void {
  const pages = getCurrentPages()

  if (pages.length <= delta) {
    uni.switchTab({ url: ROUTES.MSITE })
    return
  }

  uni.navigateBack({
    delta,
    fail: () => {
      uni.switchTab({ url: ROUTES.MSITE })
    },
  })
}

/** 重置到某个 tabBar 页（清空页面栈）。对齐 web-user 的 `router.replace('/home')` 死链修正 */
export function reLaunchToTab(path: string = ROUTES.MSITE): void {
  uni.reLaunch({ url: path })
}

/** 动态改导航栏标题。对齐 web-user 的 `document.title = to.meta.title` */
export function setNavigationBarTitle(title: string): void {
  if (!title) {
    return
  }
  uni.setNavigationBarTitle({ title })
}

/**
 * 注册路由拦截器。
 *
 * ⚠️ **两个拦不住的坑**（方案 E 节）：
 * 1. `switchTab` 不可拦截 —— tabBar 切换在小程序端不走拦截器。
 *    ✅ 对本次迁移范围不构成问题：实测需鉴权的 9 个页面**没有一个是 tabBar 页**
 *    （web-user 的 msite.ts 里 tabBar 四页 meta 全无 requiresAuth），全走 navigateTo。
 * 2. 物理返回键 / 手势返回不可拦截 —— 用户从登录页返回会直接退出小程序，
 *    这是小程序的正常行为，无需处理。
 *
 * 仍保留 onShow 兜底（见下方 createAuthGuard），作为纵深防御，
 * 也防止将来把某个 tab 页改成需登录时漏掉。
 */
export function registerNavigationGuards(): void {
  const invoke = (args: { url?: string }) => {
    if (!args?.url) {
      return args
    }
    // 返回 false 可中止跳转；这里改用 guard 内部主动 redirect，故总是返回 args
    guard(args.url)
    return args
  }

  // reLaunch 也要拦：404 页与支付结果页会用它回首页
  for (const api of ['navigateTo', 'redirectTo', 'reLaunch'] as const) {
    uni.addInterceptor(api, { invoke })
  }
}

/**
 * 生成页面 onShow 里用的鉴权兜底。
 *
 * 用法（tabBar 页或任何需登录页）：
 * ```ts
 * onShow(createAuthGuard('/pkg-order/order'))
 * ```
 *
 * ⚠️ 必须是 onShow 而非 onLoad：tabBar 页不销毁，二次进入只触发 onShow。
 */
export function createAuthGuard(path: string): () => void {
  return () => {
    if (requiresAuth(path) && !isAuthenticated()) {
      redirectToLogin(path)
    }
  }
}

/** 供调试/测试：重置注入的鉴权检查器 */
export function __resetAuthChecker(): void {
  isAuthenticated = () => false
}

export { AUTH_PAGES, ROUTES }

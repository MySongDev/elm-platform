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
  parseQuery,
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
 * 登录跳转进行中的锁。
 * 删掉它 → 同一个未授权瞬间里，401 处理器、拦截器 guard、页面 onShow 兜底会各发一次
 * redirectToLogin，后发的用各自的当前路径覆盖 redirect，用户登录后回到错误页面。
 * 跳转完成（success/fail）后释放，下一次过期仍能正常跳。
 */
let isRedirectingToLogin = false

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
  if (isRedirectingToLogin) {
    return
  }

  // 已站在登录流程页上时（401 处理器触发、登录页自身请求失败等），
  // 不能拿登录页路径当回跳目标——resolveLoginRedirect 会兜底成首页，原目标就此丢失。
  const current = getCurrentFullPath()
  if (isAuthPage(stripQuery(current))) {
    return
  }

  const target = redirect || current || ROUTES.MSITE
  const url = withQuery(ROUTES.LOGIN, { redirect: target })

  isRedirectingToLogin = true
  const releaseLock = () => {
    isRedirectingToLogin = false
  }

  uni.redirectTo({
    url,
    success: releaseLock,
    fail: (error) => {
      // redirectTo 失败（如页面栈已满）时退回 reLaunch，保证用户不会卡在原地
      console.error('[navigation] redirectToLogin failed, fallback to reLaunch:', error)
      uni.reLaunch({
        url,
        success: releaseLock,
        fail: releaseLock,
      })
    },
  })
}

/**
 * 登录收尾统一入口（密码登录与短信登录共用）。
 *
 * 普通页用 reLaunch 清空整个栈：登录页、短信验证页都压在原页面上方，
 * 用 navigateTo 会在返回键里残留一层验证码页，用户退回去会重见登录界面。
 * 代价是原来被 redirectTo 替换掉的业务页不会重建，目标页作为新入口（栈深 1）。
 * tabBar 页不能用 reLaunch 带参数，且 switchTab 本身就会关掉所有非 tabBar 页，直接用它。
 */
export function navigateAfterLogin(redirect?: unknown): void {
  const target = resolveLoginRedirect(redirect)
  const path = stripQuery(target)

  if (isTabBarPage(path)) {
    uni.switchTab({
      url: path,
      fail: () => reLaunchToTab(),
    })
    return
  }

  uni.reLaunch({
    url: target,
    fail: (error) => {
      // 目标页不存在/参数致失败时不能停在已登录的登录页，回首页兜底
      console.error('[navigation] navigateAfterLogin failed, fallback to msite:', error)
      reLaunchToTab()
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
    navigateAfterLogin(query.redirect)
    return false
  }

  if (requiresAuth(path) && !isAuthenticated()) {
    redirectToLogin(targetPath)
    return false
  }

  return true
}

/** 从完整路径里取出 redirect 参数（复用项目内解析器，小程序端不依赖 URLSearchParams） */
function parseRedirectFrom(fullPath: string): Record<string, string> {
  const cut = fullPath.indexOf('?')
  if (cut === -1) {
    return {}
  }
  return { redirect: parseQuery(fullPath.slice(cut + 1)).redirect ?? '' }
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
    // ⚠️ 必须返回 false 才算「中止」：拦截器链里返回 false 时框架直接返回空结果、不调底层 API。
    // 之前这里总是 return args，guard 虽然自己跳了登录，但被拦下的原跳转仍会执行，
    // 结果是登录页刚压栈就又被目标页盖掉，redirect 参数形同虚设。
    return guard(args.url) ? args : false
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
 * ⚠️ 这里必须用页面栈里的完整路径而不是传入的 path：path 只是静态路由字符串，
 *    shop 页的 shopid、地址页的 id 都在 query 里，只用 path 会把参数丢在登录页外面。
 */
export function createAuthGuard(path: string): () => void {
  return () => {
    if (!requiresAuth(path) || isAuthenticated()) {
      return
    }
    const current = getCurrentFullPath()
    // 栈顶路径与守卫页一致时才用完整路径；否则页面栈状态异常，退回静态路径更安全
    redirectToLogin(stripQuery(current) === path && current ? current : path)
  }
}

/** 供调试/测试：重置注入的鉴权检查器与跳转锁 */
export function __resetAuthChecker(): void {
  isAuthenticated = () => false
  isRedirectingToLogin = false
}

export { AUTH_PAGES, ROUTES }

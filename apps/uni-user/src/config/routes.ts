/**
 * 页面路径常量 —— 分包后跳转路径的**单一真源**
 *
 * 为什么必须集中维护（迁移方案议题 5「分包后所有跳转路径要改」）：
 * web-user 用路由 name 跳转（`router.push({ name: 'Shop' })`），uni-app 只认路径；
 * 分包后路径变长（`pages/shop/shop` → `pkg-shop/shop`）。散落的字符串在调整分包时
 * 要逐个找改，集中在本文件则只改这一处。
 *
 * ⚠️ 本文件的分包归属必须与 `src/pages.json` 的 subPackages 保持一致。
 * 改动任一处都要同步另一处（pages.json 是 uni-app 的构建期真源，本文件是运行时真源）。
 */

/** 全部页面路径。键名沿用 web-user 的路由 name，便于对照迁移。 */
export const ROUTES = {
  // ── 主包：tabBar 四页（uni-app 硬性要求 tabBar 页在主包）+ 404 ──
  MSITE: '/pages/msite/msite',
  SEARCH_HOME: '/pages/search/SearchHome',
  CART: '/pages/cart/cart',
  PROFILE: '/pages/profile/profile',
  NOT_FOUND: '/pages/error/404',

  // ── pkg-shop：体积最大的页面，从 msite/search 进入（主流程） ──
  SHOP: '/pkg-shop/shop',

  // ── pkg-order：结算链路，从 cart 进入 ──
  ORDER: '/pkg-order/order',
  PAYMENT: '/pkg-order/payment',
  PAYMENT_RESULT: '/pkg-order/PaymentResult',

  // ── pkg-profile：★ @vant/area-data（155.3 KB）在 AddressAdd 里，故整包必须分包 ──
  INFO: '/pkg-profile/info',
  SET_USERNAME: '/pkg-profile/setusername',
  ADDRESS_HOME: '/pkg-profile/addressHome',
  ADDRESS_ADD: '/pkg-profile/AddressAdd',
  ADDRESS_DETAIL: '/pkg-profile/AddressDatil',

  // ── pkg-auth：未登录时进入 ──
  LOGIN: '/pkg-auth/login',
  SMS_VERIFICATION: '/pkg-auth/SmsVerification',
  FORGET: '/pkg-auth/forget',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * tabBar 页面集合。
 * ⚠️ 这些页面**必须用 `uni.switchTab` 跳转**，用 navigateTo/redirectTo 会直接失败。
 * 对应 web-user 的 NavbarLayout 四个子路由（msite/search/cart/profile）。
 */
export const TAB_BAR_PAGES: readonly string[] = [
  ROUTES.MSITE,
  ROUTES.SEARCH_HOME,
  ROUTES.CART,
  ROUTES.PROFILE,
]

/** 购物车在 tabBar 里的下标，`uni.setTabBarBadge({ index })` 要用 */
export const CART_TAB_INDEX = 2

export function isTabBarPage(path: string): boolean {
  // 去掉 query 与 hash 后比较（switchTab 不接受带参数的路径）
  const bare = stripQuery(path)
  return TAB_BAR_PAGES.includes(bare)
}

/**
 * 需要登录才能访问的页面。
 *
 * ⚠️ **实测修正了迁移方案 E 节的一处误判**：方案称「cart、profile 这两个需登录的 tab 页
 * 必须在 onShow 里自行校验」，但 web-user 的 `router/modules/msite.ts` 里
 * **tabBar 四页的 meta 全都没有 `requiresAuth`** —— 它们本来就不需要登录
 * （未登录也能浏览、加购，符合外卖 App 的常规交互）。
 *
 * 实测真正带 `requiresAuth: true` 的是以下 9 个页面（全部在分包里）：
 * shop / info / setusername / addressHome / AddressAdd / AddressDatil /
 * order / payment / PaymentResult。
 *
 * 连带影响：方案 E 节说的「switchTab 拦不住，所以 tabBar 页要 onShow 兜底」这个坑
 * **对本次迁移范围不构成问题** —— 因为需要鉴权的页面没有一个是 tabBar 页，
 * 全部走 navigateTo，`uni.addInterceptor('navigateTo')` 能拦住。
 * onShow 兜底仍保留（纵深防御，且防止将来把某个 tab 页改成需登录）。
 */
export const REQUIRES_AUTH_PAGES: readonly string[] = [
  ROUTES.SHOP,
  ROUTES.INFO,
  ROUTES.SET_USERNAME,
  ROUTES.ADDRESS_HOME,
  ROUTES.ADDRESS_ADD,
  ROUTES.ADDRESS_DETAIL,
  ROUTES.ORDER,
  ROUTES.PAYMENT,
  ROUTES.PAYMENT_RESULT,
]

/** 登录相关页面（已登录时访问要跳走，对齐 web-user `router/index.ts:62` 的逻辑） */
export const AUTH_PAGES: readonly string[] = [
  ROUTES.LOGIN,
  ROUTES.SMS_VERIFICATION,
  ROUTES.FORGET,
]

export function requiresAuth(path: string): boolean {
  return REQUIRES_AUTH_PAGES.includes(stripQuery(path))
}

export function isAuthPage(path: string): boolean {
  return AUTH_PAGES.includes(stripQuery(path))
}

/** 去掉 query 与 hash，只留路径部分 */
export function stripQuery(path: string): string {
  const cut = path.indexOf('?')
  const noQuery = cut === -1 ? path : path.slice(0, cut)
  const hashCut = noQuery.indexOf('#')
  return hashCut === -1 ? noQuery : noQuery.slice(0, hashCut)
}

/**
 * 解析登录成功后的跳转目标。
 *
 * ⚠️ **修正了方案 E 节列出的死链**：web-user 的 `router/index.ts:52` 默认回落 `/home`，
 * 而 home 页**不在迁移范围**（小程序端没有这个页面）→ 改回落 msite（tabBar 首页）。
 */
export function resolveLoginRedirect(redirect?: unknown): string {
  const target = Array.isArray(redirect) ? redirect[0] : redirect

  if (typeof target !== 'string' || !target) {
    return ROUTES.MSITE
  }
  // 不能回落到登录相关页面，否则会形成循环跳转
  if (isAuthPage(target)) {
    return ROUTES.MSITE
  }
  return target
}

/**
 * 带 query 拼接。
 * ⚠️ 值统一 encodeURIComponent —— 例如 shop 页要传 `shopid`，
 * 地址页要传中文地址名。
 */
export function withQuery(
  path: string,
  query: Record<string, string | number | boolean | null | undefined>,
): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }

  return parts.length === 0 ? path : `${path}?${parts.join('&')}`
}

/**
 * 解析 query。小程序端 `onLoad(options)` 给的是已解码对象，
 * 但从 `getCurrentPages()` 取到的 `$page.options` 或手拼字符串需要解析 → 本函数兜住后者。
 */
export function parseQuery(queryString: string): Record<string, string> {
  const raw = queryString.startsWith('?') ? queryString.slice(1) : queryString
  const result: Record<string, string> = {}

  if (!raw) {
    return result
  }

  for (const pair of raw.split('&')) {
    if (!pair) {
      continue
    }
    const eq = pair.indexOf('=')
    const key = eq === -1 ? pair : pair.slice(0, eq)
    const value = eq === -1 ? '' : pair.slice(eq + 1)
    result[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '))
  }

  return result
}

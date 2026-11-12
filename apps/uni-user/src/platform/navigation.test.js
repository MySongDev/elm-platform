import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveLoginRedirect, ROUTES, withQuery } from '@/config/routes'
import {
  __resetAuthChecker,
  createAuthGuard,
  getCurrentFullPath,
  guard,
  navigateAfterLogin,
  redirectToLogin,
  registerNavigationGuards,
  setAuthChecker,
} from '@/platform/navigation'

// 这些用例锁定登录回跳链路的关键契约：目标不丢参数、非法目标不跳、
// 拦截要真正中止原跳转、登录收尾要清掉登录中间页。

let pages = []
let uniMock

beforeEach(() => {
  pages = []
  __resetAuthChecker()
  uniMock = {
    addInterceptor: vi.fn(),
    // 默认不同步触发 success：让跳转锁保持「进行中」，便于断言去重
    redirectTo: vi.fn(),
    reLaunch: vi.fn(),
    switchTab: vi.fn(),
  }
  vi.stubGlobal('getCurrentPages', () => pages)
  vi.stubGlobal('uni', uniMock)
})

function setTopPage(route, options = {}) {
  pages = [{
    route,
    options,
  }]
}

describe('resolveLoginRedirect', () => {
  it('保留合法目标与参数', () => {
    expect(resolveLoginRedirect(withQuery(ROUTES.SHOP, { shopid: 5 })))
      .toBe('/pkg-shop/shop?shopid=5')
  })

  it('解开一次外层编码，但不动参数里的 %26', () => {
    const encoded = encodeURIComponent(withQuery(ROUTES.ORDER, { shopName: '商&家' }))
    expect(resolveLoginRedirect(encoded)).toBe('/pkg-order/order?shopName=%E5%95%86%26%E5%AE%B6')
  })

  it.each([
    ['空值', ''],
    ['外部地址', 'https://evil.example.com'],
    ['未登记页面', '/pkg-shop/not-exist'],
    ['登录页自身', ROUTES.LOGIN],
    ['短信验证页', ROUTES.SMS_VERIFICATION],
    ['404 页', ROUTES.NOT_FOUND],
  ])('%s 回落首页', (_label, value) => {
    expect(resolveLoginRedirect(value)).toBe(ROUTES.MSITE)
  })
})

describe('getCurrentFullPath', () => {
  it('带上栈顶页面的 query，登录过期后才不会丢 id', () => {
    setTopPage('pkg-profile/AddressAdd', { id: '3' })
    expect(getCurrentFullPath()).toBe('/pkg-profile/AddressAdd?id=3')
  })
})

describe('guard', () => {
  it('未登录进需鉴权页：返回 false 并带完整目标跳登录', () => {
    setTopPage('pages/msite/msite')
    setAuthChecker(() => false)

    expect(guard('/pkg-shop/shop?shopid=5')).toBe(false)
    expect(uniMock.redirectTo).toHaveBeenCalledWith(expect.objectContaining({
      url: withQuery(ROUTES.LOGIN, { redirect: '/pkg-shop/shop?shopid=5' }),
    }))
  })

  it('未登录进非鉴权页：放行', () => {
    setTopPage('pages/msite/msite')
    setAuthChecker(() => false)

    expect(guard('/pages/msite/msite')).toBe(true)
    expect(uniMock.redirectTo).not.toHaveBeenCalled()
  })
})

describe('redirectToLogin', () => {
  it('跳转进行中重复触发不会覆盖原目标', () => {
    setTopPage('pkg-shop/shop', { shopid: '5' })
    setAuthChecker(() => false)

    redirectToLogin('/pkg-shop/shop?shopid=5')
    redirectToLogin('/pkg-order/order')

    expect(uniMock.redirectTo).toHaveBeenCalledTimes(1)
  })

  it('已站在登录页时不再跳，避免把登录页路径当成回跳目标', () => {
    setTopPage('pkg-auth/login', { redirect: '/pkg-shop/shop?shopid=5' })
    setAuthChecker(() => false)

    redirectToLogin()

    expect(uniMock.redirectTo).not.toHaveBeenCalled()
  })
})

describe('createAuthGuard', () => {
  it('用栈顶完整路径保留参数，而不是静态路由字符串', () => {
    setTopPage('pkg-shop/shop', { shopid: '5' })
    setAuthChecker(() => false)

    createAuthGuard(ROUTES.SHOP)()

    expect(uniMock.redirectTo).toHaveBeenCalledWith(expect.objectContaining({
      url: withQuery(ROUTES.LOGIN, { redirect: '/pkg-shop/shop?shopid=5' }),
    }))
  })
})

describe('navigateAfterLogin', () => {
  it('tabBar 目标走 switchTab', () => {
    navigateAfterLogin(ROUTES.PROFILE)

    expect(uniMock.switchTab).toHaveBeenCalledWith(expect.objectContaining({ url: ROUTES.PROFILE }))
    expect(uniMock.reLaunch).not.toHaveBeenCalled()
  })

  it('普通页用 reLaunch 清除登录中间页，并保留参数', () => {
    navigateAfterLogin(withQuery(ROUTES.SHOP, { shopid: 5 }))

    expect(uniMock.reLaunch).toHaveBeenCalledWith(expect.objectContaining({
      url: '/pkg-shop/shop?shopid=5',
    }))
  })

  it('目标跳转失败时回落首页，不停在已登录的登录页', () => {
    // 首次 reLaunch 触发失败；兜底那次 reLaunch 不带 fail 回调，用可选调用避免误崩
    uniMock.reLaunch.mockImplementation(({ fail }) => fail?.(new Error('page not found')))

    navigateAfterLogin(ROUTES.SHOP)

    expect(uniMock.reLaunch).toHaveBeenLastCalledWith(expect.objectContaining({ url: ROUTES.MSITE }))
  })
})

describe('registerNavigationGuards', () => {
  it('拦截时 invoke 返回 false，原跳转才会真正中止', () => {
    setTopPage('pages/msite/msite')
    setAuthChecker(() => false)
    registerNavigationGuards()

    const { invoke } = uniMock.addInterceptor.mock.calls[0][1]
    expect(invoke({ url: '/pkg-order/order' })).toBe(false)
  })
})

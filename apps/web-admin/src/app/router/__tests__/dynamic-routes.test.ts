import type { Router, RouteRecordRaw } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getDashboardOverview } from '@/features/dashboard/api/dashboard'
import { registerDynamicRoutes, resetDynamicRoutes } from '../permission'

vi.mock('@/locales', () => ({
  $t: (key: string) => key,
}))

/** 测试用后端菜单数据（符合 BackendMenu 类型） */
const testMenus = [{
  id: 1,
  parentId: null,
  title: 'Dashboard',
  path: '/dashboard',
  name: 'Dashboard',
  icon: 'dashboard',
  permission: null,
  component: null,
  type: 'catalog' as const,
  sort: 1,
  status: 1,
  children: [{
    id: 2,
    parentId: 1,
    title: 'Overview',
    path: '/dashboard/index',
    name: 'DashboardView',
    icon: 'dashboard',
    permission: null,
    component: null,
    type: 'menu' as const,
    sort: 1,
    status: 1,
  }],
}, {
  id: 20,
  parentId: null,
  title: 'Commerce',
  path: '/commerce',
  name: 'Commerce',
  icon: 'document',
  permission: null,
  component: null,
  type: 'catalog' as const,
  sort: 35,
  status: 1,
  children: [{
    id: 23,
    parentId: 20,
    title: 'Order',
    path: '/commerce/order',
    name: 'CommerceOrderView',
    icon: 'document',
    permission: 'commerce:order:view',
    component: null,
    type: 'menu' as const,
    sort: 3,
    status: 1,
  }],
}, {
  id: 25,
  parentId: null,
  title: 'route.platformManagement',
  path: '/platform',
  name: 'Platform',
  icon: 'system',
  permission: null,
  component: null,
  type: 'catalog' as const,
  sort: 36,
  status: 1,
  children: [{
    id: 26,
    parentId: 25,
    title: 'route.tenantManagement',
    path: '/platform/tenant',
    name: 'PlatformTenantView',
    icon: 'system',
    permission: 'platform:tenant:view',
    component: null,
    type: 'menu' as const,
    sort: 1,
    status: 1,
  }],
}, {
  id: 4,
  parentId: null,
  title: 'Monitor',
  path: '/monitor',
  name: 'Monitor',
  icon: 'monitor',
  permission: null,
  component: null,
  type: 'catalog' as const,
  sort: 30,
  status: 1,
  children: [{
    id: 8,
    parentId: 4,
    title: 'System Logs',
    path: '/monitor/system-logs',
    name: 'SystemLogs',
    icon: 'monitor',
    permission: 'log:system:view',
    component: null,
    type: 'menu' as const,
    sort: 4,
    status: 1,
  }],
}]

function createRouterStub() {
  const addedRoutes: RouteRecordRaw[] = []
  // 预先创建足够的移除函数（最多 5 个路由 + 1 个 404 = 6 个）
  const removers = Array.from({ length: 10 }).fill(vi.fn())
  const addRoute = vi.fn((route: RouteRecordRaw) => {
    addedRoutes.push(route)
    return removers.shift() ?? vi.fn()
  })

  return {
    router: { addRoute } as unknown as Router,
    addRoute,
    addedRoutes,
  }
}

describe('dynamic routes - registerDynamicRoutes 集成测试', () => {
  beforeEach(() => {
    resetDynamicRoutes()
  })

  it('接收 BackendMenu[]，内部构建并注册路由 + 404 兜底', () => {
    const { router, addRoute, addedRoutes } = createRouterStub()

    registerDynamicRoutes(router, testMenus)

    // 4 个根级菜单 + 1 个 404 兜底
    expect(addRoute).toHaveBeenCalledTimes(5)
    // 第一个是 dashboard catalog
    expect(addedRoutes[0].path).toBe('/dashboard')
    // 最后一个是 404
    expect(addedRoutes[4]).toMatchObject({
      path: '/:pathMatch(.*)*',
      component: expect.any(Function),
    })
  })

  it('重复调用会先清理旧路由', () => {
    const firstRemove = vi.fn()
    const secondRemove = vi.fn()
    const addRoute = vi.fn()
      .mockReturnValueOnce(firstRemove)
      .mockReturnValueOnce(secondRemove)
      .mockReturnValue(vi.fn())
    const router = { addRoute } as unknown as Router

    registerDynamicRoutes(router, testMenus)
    registerDynamicRoutes(router, testMenus)

    expect(firstRemove).toHaveBeenCalledTimes(1)
    expect(secondRemove).toHaveBeenCalledTimes(1)
  })

  it('resets all registered dynamic route handlers', () => {
    const routeRemove = vi.fn()
    const notFoundRemove = vi.fn()
    // registerDynamicRoutes 会调用 addRoute 5 次（4 个菜单 + 1 个 404）
    const addRoute = vi.fn()
      .mockReturnValueOnce(routeRemove)
      .mockReturnValueOnce(notFoundRemove)
      .mockReturnValue(vi.fn()) // 其余调用返回 fn
    const router = { addRoute } as unknown as Router

    registerDynamicRoutes(router, testMenus)
    resetDynamicRoutes()

    expect(routeRemove).toHaveBeenCalledTimes(1)
    expect(notFoundRemove).toHaveBeenCalledTimes(1)
  })

  it('resolves dashboard pending work against real backend menu route names', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [],
    })

    // 直接传菜单，内部会 buildRoutes 并注册
    registerDynamicRoutes(router, testMenus)

    const overview = await getDashboardOverview()

    const pendingRouteNames = overview.pendingItems
      .map(item => item.routeName)
      .filter((name): name is string => Boolean(name))

    expect(pendingRouteNames).toContain('PlatformTenantView')
    expect(
      pendingRouteNames.map(name => router.resolve({ name }).path),
    ).toEqual([
      '/commerce/order',
      '/commerce/order',
      '/platform/tenant',
      '/monitor/system-logs',
    ])
  })
})

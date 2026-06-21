import type { Router, RouteRecordRaw } from 'vue-router'
import type { UserMenuNode } from '@/entities/session/model/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getDashboardOverview } from '@/features/dashboard/api/dashboard'
import { buildRoutes } from '../build-routes'
import { registerDynamicRoutes, resetDynamicRoutes } from '../dynamic-routes'

vi.mock('@/locales', () => ({
  $t: (key: string) => key,
}))

const testMenus: UserMenuNode[] = [{
  id: 1,
  parentId: null,
  title: 'Dashboard',
  path: '/dashboard',
  name: 'Dashboard',
  icon: 'dashboard',
  permission: null,
  component: null,
  type: 'catalog',
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
    type: 'menu',
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
  type: 'catalog',
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
    type: 'menu',
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
  type: 'catalog',
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
    type: 'menu',
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
  type: 'catalog',
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
    type: 'menu',
    sort: 4,
    status: 1,
  }],
}]
function createRouterStub() {
  const addedRoutes: RouteRecordRaw[] = []
  const removers = [vi.fn(), vi.fn(), vi.fn()]
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

describe('dynamic routes', () => {
  beforeEach(() => {
    resetDynamicRoutes()
  })

  it('registers dynamic routes and the not-found route', () => {
    const { router, addRoute, addedRoutes } = createRouterStub()
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        component: {},
      },
      {
        path: '/monitor',
        component: {},
      },
    ]

    registerDynamicRoutes(router, routes)

    expect(addRoute).toHaveBeenCalledTimes(3)
    expect(addedRoutes[0]).toBe(routes[0])
    expect(addedRoutes[1]).toBe(routes[1])
    expect(addedRoutes[2]).toMatchObject({
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    })
  })

  it('removes previously registered routes before registering new ones', () => {
    const firstRemove = vi.fn()
    const secondRemove = vi.fn()
    const addRoute = vi.fn()
      .mockReturnValueOnce(firstRemove)
      .mockReturnValueOnce(secondRemove)
      .mockReturnValue(vi.fn())
    const router = { addRoute } as unknown as Router

    registerDynamicRoutes(router, [{
      path: '/first',
      component: {},
    }])
    registerDynamicRoutes(router, [{
      path: '/second',
      component: {},
    }])

    expect(firstRemove).toHaveBeenCalledTimes(1)
    expect(secondRemove).toHaveBeenCalledTimes(1)
  })

  it('resets all registered dynamic route handlers', () => {
    const routeRemove = vi.fn()
    const notFoundRemove = vi.fn()
    const addRoute = vi.fn()
      .mockReturnValueOnce(routeRemove)
      .mockReturnValueOnce(notFoundRemove)
    const router = { addRoute } as unknown as Router

    registerDynamicRoutes(router, [{
      path: '/system',
      component: {},
    }])
    resetDynamicRoutes()

    expect(routeRemove).toHaveBeenCalledTimes(1)
    expect(notFoundRemove).toHaveBeenCalledTimes(1)
  })

  it('resolves dashboard pending work against real backend menu route names', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [],
    })
    const routes = buildRoutes(testMenus)
    const overview = await getDashboardOverview()

    registerDynamicRoutes(router, routes)

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

import type { Router, RouteRecordRaw } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerDynamicRoutes, resetDynamicRoutes } from '../dynamic-routes'

vi.mock('@/locales', () => ({
  $t: (key: string) => key,
}))

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
      { path: '/system', component: {} },
      { path: '/monitor', component: {} },
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

    registerDynamicRoutes(router, [{ path: '/first', component: {} }])
    registerDynamicRoutes(router, [{ path: '/second', component: {} }])

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

    registerDynamicRoutes(router, [{ path: '/system', component: {} }])
    resetDynamicRoutes()

    expect(routeRemove).toHaveBeenCalledTimes(1)
    expect(notFoundRemove).toHaveBeenCalledTimes(1)
  })
})

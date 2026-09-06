import type { RouteRecordRaw } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRoutes, registerDynamicRoutes, resetDynamicRoutes } from '../permission'

// Mock 页面组件模块
vi.mock('/src/pages/**/index.vue', () => ({
  '/src/pages/dashboard/index/index.vue': { name: 'DashboardView' },
  '/src/pages/system/user/index.vue': { name: 'UserList' },
  '/src/pages/system/role/index.vue': { name: 'RoleManagement' },
  '/src/pages/commerce/restaurant/index.vue': { name: 'CommerceRestaurantView' },
  '/src/pages/commerce/order/index.vue': { name: 'CommerceOrderView' },
  '/src/pages/monitor/logs/system/index.vue': { name: 'SystemLogs' },
  '/src/pages/error/404.vue': { name: 'NotFound' },
}))

/** 创建测试用后端菜单节点 */
function createMenu(overrides: Partial<Parameters<typeof buildRoutes>[0][0]> = {}) {
  return {
    id: 1,
    parentId: null,
    title: 'route.default',
    path: '/default',
    name: null,
    icon: null,
    permission: null,
    component: null,
    type: 'menu' as const,
    sort: 1,
    status: 1,
    ...overrides,
  }
}

/** 创建 Router 存根用于测试注册逻辑 */
function createRouterStub() {
  const addedRoutes: RouteRecordRaw[] = []
  const addRoute = vi.fn((route: RouteRecordRaw) => {
    addedRoutes.push(route)
    return vi.fn()
  })

  // 使用 any 避免 Router 类型的完整约束，仅测试 addRoute 调用
  return {
    router: { addRoute } as any,
    addRoute,
    addedRoutes,
  }
}

describe('permission.ts - 精简版权限路由构建器', () => {
  beforeEach(() => {
    resetDynamicRoutes()
  })

  describe('buildRoutes', () => {
    it('构建根级目录菜单：挂载 Layout + redirect 到首个子路由', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.system',
          path: '/system',
          type: 'catalog',
          sort: 1,
          children: [
            createMenu({
              id: 2,
              title: 'route.user',
              path: 'user',
              name: 'UserList',
              sort: 10,
            }),
            createMenu({
              id: 3,
              title: 'route.role',
              path: 'role',
              name: 'RoleManagement',
              sort: 5,
            }),
          ],
        }),
      ])

      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/system')
      expect(routes[0].component).toBeDefined() // Layout
      expect(routes[0].redirect).toBe('/system/role') // 按 sort 排序，role 在前
      expect(routes[0].meta?.alwaysShow).toBe(true)
      expect(routes[0].children?.map(r => r.path)).toEqual(['role', 'user'])
    })

    it('嵌套目录：redirect 递归查找首个可达叶子路由', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.monitor',
          path: '/monitor',
          type: 'catalog',
          children: [
            createMenu({
              id: 2,
              title: 'route.logs',
              path: 'logs',
              type: 'catalog',
              children: [
                createMenu({
                  id: 3,
                  title: 'route.loginLog',
                  path: 'login',
                  name: 'LoginLog',
                }),
              ],
            }),
          ],
        }),
      ])

      expect(routes[0].redirect).toBe('/monitor/logs/login')
      expect(routes[0].children?.[0].redirect).toBe('/monitor/logs/login')
    })

    it('叶子菜单：绑定真实页面组件', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.user',
          path: '/system/user',
          name: 'UserList',
          component: 'system/user/index',
        }),
      ])

      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/system/user')
      expect(routes[0].name).toBe('UserList')
      expect(routes[0].component).toBeDefined() // 实际页面组件
    })

    it('过滤禁用菜单', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.disabled',
          path: '/disabled',
          status: 0,
        }),
        createMenu({
          title: 'route.valid',
          path: '/valid',
          name: 'Valid',
          status: 1,
        }),
      ])

      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/valid')
    })

    it('按 sort 升序排列路由', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.b',
          path: '/b',
          name: 'B',
          sort: 20,
        }),
        createMenu({
          title: 'route.a',
          path: '/a',
          name: 'A',
          sort: 10,
        }),
      ])

      expect(routes.map(r => r.path)).toEqual(['/a', '/b'])
    })

    it('绝对路径直接使用，相对路径拼接父路径', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.catalog',
          path: '/catalog',
          type: 'catalog',
          children: [
            createMenu({
              id: 2,
              title: 'route.absolute',
              path: '/absolute',
              name: 'Absolute',
            }), // 绝对路径
            createMenu({
              id: 3,
              title: 'route.relative',
              path: 'relative',
              name: 'Relative',
            }), // 相对路径
          ],
        }),
      ])

      const childPaths = routes[0].children?.map(r => r.path) ?? []
      expect(childPaths).toContain('/absolute')
      expect(childPaths).toContain('relative')
    })

    it('空目录（children 为空数组）被过滤', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.empty',
          path: '/empty',
          type: 'catalog',
          children: [],
        }),
        createMenu({
          title: 'route.valid',
          path: '/valid',
          name: 'Valid',
        }),
      ])

      expect(routes).toHaveLength(1)
      expect(routes[0].path).toBe('/valid')
    })

    it('meta 包含 title、icon、auths', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.user',
          path: '/system/user',
          name: 'UserList',
          icon: 'user-icon',
          permission: 'system:user:list',
        }),
      ])

      expect(routes[0].meta).toMatchObject({
        title: 'route.user',
        icon: 'user-icon',
        auths: ['system:user:list'],
      })
    })

    it('component 字段优先，回退到路径推导', () => {
      const routes = buildRoutes([
        createMenu({
          title: 'route.explicit',
          path: '/explicit',
          name: 'Explicit',
          component: 'system/user/index',
        }),
        createMenu({
          title: 'route.fallback',
          path: '/fallback/path',
          name: 'Fallback',
        }),
      ])

      // 显式 component 应解析到 system/user/index
      expect(routes[0].component).toBeDefined()
      // 无 component 时按路径推导
      expect(routes[1].component).toBeDefined()
    })
  })

  describe('registerDynamicRoutes', () => {
    it('注册动态路由并添加 404 兜底', () => {
      const { router, addRoute, addedRoutes } = createRouterStub()
      const menus = [
        createMenu({
          title: 'route.system',
          path: '/system',
          type: 'catalog',
          children: [
            createMenu({
              id: 2,
              title: 'route.user',
              path: 'user',
              name: 'UserList',
            }),
          ],
        }),
      ]

      registerDynamicRoutes(router, menus)

      // 1 个动态路由 + 1 个 404 兜底
      expect(addRoute).toHaveBeenCalledTimes(2)
      expect(addedRoutes[0].path).toBe('/system')
      expect(addedRoutes[1].path).toBe('/:pathMatch(.*)*')
    })

    it('重复调用会先清理旧路由', () => {
      const { router, addRoute } = createRouterStub()
      const menus = [createMenu({
        title: 'route.a',
        path: '/a',
        name: 'A',
      })]

      registerDynamicRoutes(router, menus)
      registerDynamicRoutes(router, menus)

      // 每次注册都会调用 addRoute，旧路由的移除函数也会被调用（通过 vi.fn 模拟）
      expect(addRoute).toHaveBeenCalledTimes(4) // 2 次注册 × (1 路由 + 1 404)
    })
  })

  describe('resetDynamicRoutes', () => {
    it('清理所有已注册路由的移除句柄', () => {
      const remove1 = vi.fn()
      const remove2 = vi.fn()
      const { router, addRoute } = createRouterStub()
      addRoute.mockReturnValueOnce(remove1).mockReturnValueOnce(remove2)

      registerDynamicRoutes(router, [createMenu({
        title: 'route.a',
        path: '/a',
        name: 'A',
      })])
      resetDynamicRoutes()

      expect(remove1).toHaveBeenCalledTimes(1)
      expect(remove2).toHaveBeenCalledTimes(1)
    })
  })
})

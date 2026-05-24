import type { UserMenuNode } from '@/entities/session'
import { describe, expect, it, vi } from 'vitest'
import { buildRoutes, buildRoutesFromRouteMenus } from '../build-routes'
import { adaptBackendMenusToRouteMenus } from '../menu-adapter'
import { validateMenuTree } from '../menu-schema'

vi.mock('../component-map', () => ({
  layoutComponent: { name: 'Layout' },
  resolveComponent: (key: string) => ({ name: `View:${key}` }),
}))

function createMenu(overrides: Partial<UserMenuNode>): UserMenuNode {
  return {
    id: 1,
    parentId: null,
    title: 'route.default',
    path: '/default',
    name: null,
    icon: null,
    permission: null,
    component: null,
    type: 'menu',
    sort: 1,
    status: 1,
    ...overrides,
  }
}

describe('buildRoutes', () => {
  it('redirects catalog routes to the first enabled child after sorting', () => {
    const routes = buildRoutes([
      createMenu({
        title: 'route.system',
        path: '/system',
        type: 'catalog',
        sort: 1,
        children: [
          createMenu({
            id: 2,
            title: 'route.disabled',
            path: 'disabled',
            name: 'Disabled',
            sort: 1,
            status: 0,
          }),
          createMenu({
            id: 3,
            title: 'route.user',
            path: 'user',
            name: 'User',
            sort: 30,
          }),
          createMenu({
            id: 4,
            title: 'route.role',
            path: 'role',
            name: 'Role',
            sort: 10,
          }),
        ],
      }),
    ])

    expect(routes).toHaveLength(1)
    expect(routes[0].redirect).toBe('/system/role')
    expect(routes[0].children?.map(route => route.path)).toEqual(['role', 'user'])
  })

  it('redirects nested catalog routes to their first reachable leaf route', () => {
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

  it('uses known route title keys before non-empty backend menu titles', () => {
    const routes = buildRoutes([
      createMenu({
        title: '仪表盘',
        path: '/dashboard/index',
        name: 'DashboardView',
      }),
      createMenu({
        id: 2,
        title: 'route.systemLog',
        path: '/monitor/system-logs',
        name: 'SystemLogs',
      }),
    ])

    expect(routes.map(route => route.meta?.title)).toEqual([
      'route.dashboard',
      'route.systemLog',
    ])
  })
  it('keeps blank backend titles and falls back to route title map', () => {
    const routes = buildRoutes([
      createMenu({
        title: '   ',
        path: '/monitor/system-logs',
        name: 'SystemLogs',
      }),
    ])

    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('/monitor/system-logs')
    expect(routes[0].meta?.title).toBe('route.systemLog')
  })

  it('uses local monitor page aliases for legacy backend monitor paths', () => {
    const routes = buildRoutes([
      createMenu({
        title: '系统监控',
        path: '/monitor',
        type: 'catalog',
        children: [
          createMenu({
            id: 2,
            title: '在线用户',
            path: '/monitor/online-user',
            name: 'OnlineUser',
          }),
          createMenu({
            id: 3,
            title: '登录日志',
            path: '/monitor/login-logs',
            name: 'LoginLogs',
          }),
          createMenu({
            id: 4,
            title: '操作日志',
            path: '/monitor/operation-logs',
            name: 'OperationLogs',
          }),
          createMenu({
            id: 5,
            title: '系统日志',
            path: '/monitor/system-logs',
            name: 'SystemLogs',
          }),
        ],
      }),
    ])

    expect(routes[0].children?.map(route => route.component)).toEqual([
      { name: 'View:monitor/online' },
      { name: 'View:monitor/logs/login' },
      { name: 'View:monitor/logs/operation' },
      { name: 'View:monitor/logs/system' },
    ])
  })

  it('normalizes legacy explicit monitor component keys before resolving local pages', () => {
    const routes = buildRoutes([
      createMenu({
        title: '系统监控',
        path: '/monitor',
        type: 'catalog',
        children: [
          createMenu({
            id: 2,
            title: '在线用户',
            path: '/monitor/online-user',
            name: 'OnlineUser',
            component: 'monitor/online-user/index',
          }),
          createMenu({
            id: 3,
            title: '操作日志',
            path: '/monitor/operation-logs',
            name: 'OperationLogs',
            component: '/monitor/operation-logs/',
          }),
          createMenu({
            id: 4,
            title: '系统日志',
            path: '/monitor/system-logs',
            name: 'SystemLogs',
            component: 'monitor/system-logs/index.vue',
          }),
        ],
      }),
    ])

    expect(routes[0].children?.map(route => route.component)).toEqual([
      { name: 'View:monitor/online' },
      { name: 'View:monitor/logs/operation' },
      { name: 'View:monitor/logs/system' },
    ])
  })

  it('drops invalid menu nodes before route construction', () => {
    const routes = buildRoutes([
      createMenu({
        path: '',
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
})

describe('adaptBackendMenusToRouteMenus', () => {
  it('maps a UserList backend menu to a RouteMenuNode', () => {
    const routeMenus = adaptBackendMenusToRouteMenus([
      createMenu({
        title: ' 用户列表 ',
        path: '/system/user',
        name: 'UserList',
        icon: 'user',
        permission: 'system:user:list',
        component: 'system/user/index',
        sort: 10,
      }),
    ])

    expect(routeMenus).toEqual([
      {
        path: '/system/user',
        name: 'UserList',
        component: 'system/user/index',
        title: 'route.userList',
        icon: 'user',
        order: 10,
        auths: ['system:user:list'],
        cacheName: 'UserList',
      },
    ])
  })
})

describe('buildRoutesFromRouteMenus', () => {
  it('builds Vue Router records from internal RouteMenuNode trees', () => {
    const routes = buildRoutesFromRouteMenus([
      {
        path: '/system',
        title: 'route.system',
        icon: 'system',
        order: 1,
        children: [
          {
            path: 'user',
            name: 'UserList',
            title: 'route.user',
            auths: ['system:user:list'],
            cacheName: 'UserList',
            order: 10,
          },
        ],
      },
    ])

    expect(routes).toHaveLength(1)
    expect(routes[0]).toMatchObject({
      path: '/system',
      component: { name: 'Layout' },
      redirect: '/system/user',
      meta: {
        title: 'route.system',
        icon: 'system',
        order: 1,
      },
    })
    expect(routes[0].children).toHaveLength(1)
    expect(routes[0].children?.[0]).toMatchObject({
      path: 'user',
      name: 'UserList',
      component: { name: 'View:system/user' },
      meta: {
        title: 'route.user',
        auths: ['system:user:list'],
        cacheName: 'UserList',
        order: 10,
      },
    })
  })
})

describe('validateMenuTree', () => {
  it('reports schema issues for invalid menu payloads', () => {
    const issues = validateMenuTree([
      {
        title: 123,
        path: '',
        type: 'unknown',
        sort: Number.NaN,
        status: 'enabled',
        children: {},
      },
    ])

    expect(issues.map(issue => issue.field)).toEqual(
      expect.arrayContaining(['title', 'path', 'type', 'sort', 'status', 'children']),
    )
  })

  it('allows blank titles so adapters can apply fallback titles', () => {
    const issues = validateMenuTree([
      createMenu({ title: '   ', path: '/monitor/system-logs', name: 'SystemLogs' }),
    ])

    expect(issues.filter(issue => issue.field === 'title')).toEqual([])
  })

  it('reports duplicate route names as warnings', () => {
    const issues = validateMenuTree([
      createMenu({ name: 'SystemUser', path: '/system/user' }),
      createMenu({ id: 2, name: 'SystemUser', path: '/system/user-copy' }),
    ])

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'warning',
      field: 'name',
    }))
  })
})

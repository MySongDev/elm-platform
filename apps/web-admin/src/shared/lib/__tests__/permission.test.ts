import type { RouteRecordRaw } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { canAccessRoute, filterRoutesByAccess, hasPermission } from '@/shared/lib/permission'

describe('hasPermission', () => {
  it('allows wildcard permissions', () => {
    expect(hasPermission(['*:*:*'], ['system:user:view', 'system:user:edit'])).toBe(true)
  })

  it('requires every requested permission', () => {
    expect(hasPermission(['system:user:view'], ['system:user:view', 'system:user:edit'])).toBe(false)
  })
})

describe('canAccessRoute', () => {
  it('checks route roles and auths with one shared policy', () => {
    const route: RouteRecordRaw = {
      path: '/system/user',
      component: {},
      meta: {
        roles: ['admin'],
        auths: ['system:user:view'],
      },
    }

    expect(canAccessRoute(route, {
      role: 'admin',
      permissions: ['system:user:view'],
    })).toBe(true)

    expect(canAccessRoute(route, {
      role: 'user',
      permissions: ['system:user:view'],
    })).toBe(false)

    expect(canAccessRoute(route, {
      role: 'admin',
      permissions: [],
    })).toBe(false)
  })

  it('rejects access when user role is missing', () => {
    expect(canAccessRoute({ meta: {} }, { permissions: [] })).toBe(false)
  })
})

describe('filterRoutesByAccess', () => {
  it('removes inaccessible child routes and empty parent routes', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        component: {},
        children: [
          {
            path: 'user',
            component: {},
            meta: { auths: ['system:user:view'] },
          },
          {
            path: 'role',
            component: {},
            meta: { auths: ['system:role:view'] },
          },
        ],
      },
      {
        path: '/monitor',
        component: {},
        children: [
          {
            path: 'online',
            component: {},
            meta: { auths: ['monitor:online:view'] },
          },
        ],
      },
    ]

    const filtered = filterRoutesByAccess(routes, 'admin', ['system:user:view'])

    expect(filtered).toHaveLength(1)
    expect(filtered[0].path).toBe('/system')
    expect(filtered[0].children?.map(route => route.path)).toEqual(['user'])
  })
})

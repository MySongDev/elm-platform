import type { RouteRecordRaw } from 'vue-router'
import { describe, expect, it } from 'vitest'
import { resolveSidebarOpenKeys } from './useSidebarMenu'

describe('resolveSidebarOpenKeys', () => {
  it('does not open a parent route rendered as a single leaf menu item', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/dashboard',
        meta: { title: 'route.dashboard' },
        children: [
          {
            path: 'index',
            meta: { title: 'route.dashboard' },
            component: {} as any,
          },
        ],
      },
    ]

    expect(resolveSidebarOpenKeys('/dashboard/index', routes)).toEqual([])
  })

  it('opens a parent route rendered as a submenu', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/system',
        meta: {
          title: 'route.system',
          alwaysShow: true,
        },
        children: [
          {
            path: 'menu',
            meta: { title: 'route.menu' },
            component: {} as any,
          },
        ],
      },
    ]

    expect(resolveSidebarOpenKeys('/system/menu', routes)).toEqual(['/system'])
  })
})

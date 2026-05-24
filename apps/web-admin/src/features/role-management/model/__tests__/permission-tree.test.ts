import type { MenuItem } from '@/entities/system-menu'
import { describe, expect, it } from 'vitest'
import {
  collectMenuPermissionCodes,
  createRoleMenuPermissionTree,
  mergeRoleMenuPermissions,
  resolveCheckedMenuIdsByPermissions,
  resolveSelectedMenuPermissionCodes,
} from '../permission-tree'

const menus: MenuItem[] = [
  {
    id: 1,
    parentId: null,
    title: '系统管理',
    path: '/system',
    name: 'System',
    icon: 'system',
    permission: null,
    type: 'catalog',
    sort: 1,
    status: 1,
    children: [
      {
        id: 2,
        parentId: 1,
        title: '用户管理',
        path: '/system/user',
        name: 'UserList',
        icon: 'user',
        permission: 'user:view',
        type: 'menu',
        sort: 1,
        status: 1,
      },
      {
        id: 6,
        parentId: 1,
        title: '总是可访问',
        path: '/system/public',
        name: 'PublicPage',
        icon: 'user',
        permission: null,
        type: 'menu',
        sort: 3,
        status: 1,
      },
      {
        id: 3,
        parentId: 1,
        title: '新增用户',
        path: '/system/user',
        name: null,
        icon: null,
        permission: 'user:add',
        type: 'button',
        sort: 2,
        status: 1,
      },
    ],
  },
  {
    id: 4,
    parentId: null,
    title: '监控',
    path: '/monitor',
    name: 'Monitor',
    icon: 'monitor',
    permission: null,
    type: 'catalog',
    sort: 2,
    status: 0,
    children: [
      {
        id: 5,
        parentId: 4,
        title: '登录日志',
        path: '/monitor/login-logs',
        name: 'LoginLogs',
        icon: 'monitor',
        permission: 'log:login:view',
        type: 'menu',
        sort: 1,
        status: 1,
      },
    ],
  },
]

describe('role menu permission tree', () => {
  it('builds a page permission tree without button or disabled menu nodes', () => {
    const tree = createRoleMenuPermissionTree(menus)

    expect(tree).toHaveLength(1)
    expect(tree[0].children?.map(item => item.id)).toEqual([2])
  })

  it('resolves checked menu ids from role page permissions', () => {
    expect(resolveCheckedMenuIdsByPermissions(menus, ['user:view', 'user:add'])).toEqual([2])
  })

  it('resolves selected page permission codes from checked menu ids', () => {
    expect(resolveSelectedMenuPermissionCodes(menus, [1, 2, 3])).toEqual(['user:view'])
  })

  it('merges selected page permissions without dropping button permissions', () => {
    const menuPermissionCodes = collectMenuPermissionCodes(menus)
    const merged = mergeRoleMenuPermissions(
      ['permission:page:view', 'user:add'],
      ['user:view'],
      menuPermissionCodes,
    )

    expect(merged).toEqual(['permission:page:view', 'user:add', 'user:view'])
  })
})

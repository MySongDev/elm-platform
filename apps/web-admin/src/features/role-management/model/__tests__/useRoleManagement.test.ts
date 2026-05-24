import type { RoleItem } from '@/entities/role'
import type { MenuItem } from '@/entities/system-menu'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, effectScope, ref, shallowRef } from 'vue'
import { useRoleManagement } from '../useRoleManagement'

const roleApi = vi.hoisted(() => ({
  createRole: vi.fn(),
  deleteRole: vi.fn(),
  getRoles: vi.fn(),
  updateRole: vi.fn(),
}))

const permissionApi = vi.hoisted(() => ({
  getButtonPermissions: vi.fn(),
}))

const menuApi = vi.hoisted(() => ({
  getMenus: vi.fn(),
}))

const crudFeedback = vi.hoisted(() => ({
  confirmDelete: vi.fn(),
  notifyDeleteSuccess: vi.fn(),
  notifySaveSuccess: vi.fn(),
}))

vi.mock('@/entities/role', () => roleApi)
vi.mock('@/entities/permission', () => permissionApi)
vi.mock('@/entities/system-menu', () => menuApi)

vi.mock('@/shared/config-crud', async () => {
  const actual = await vi.importActual<typeof import('@/shared/config-crud/model/useConfigCrud')>('@/shared/config-crud/model/useConfigCrud')

  return {
    ...actual,
    createElementPlusCrudFeedback: () => crudFeedback,
  }
})

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
    title: '系统监控',
    path: '/monitor',
    name: 'Monitor',
    icon: 'monitor',
    permission: null,
    type: 'catalog',
    sort: 2,
    status: 1,
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

const normalRole: RoleItem = {
  id: 2,
  name: '普通用户',
  code: 'user',
  status: 1,
  remark: '基础权限',
  permissions: ['user:view', 'user:add'],
  createdAt: '2026-05-23T00:00:00.000Z',
}

function runInScope<T>(factory: () => T) {
  const scope = effectScope()
  const result = scope.run(factory)
  if (!result)
    throw new Error('effect scope did not return a result')
  return {
    result,
    dispose: () => scope.stop(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('shallowRef', shallowRef)
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
  }))
  roleApi.createRole.mockResolvedValue(undefined)
  roleApi.deleteRole.mockResolvedValue(undefined)
  roleApi.getRoles.mockResolvedValue([])
  roleApi.updateRole.mockResolvedValue(undefined)
  permissionApi.getButtonPermissions.mockResolvedValue([])
  menuApi.getMenus.mockResolvedValue(menus)
  crudFeedback.confirmDelete.mockResolvedValue(true)
})

describe('useRoleManagement menu permissions', () => {
  it('renders the permission panel collapsed before marking it visible for the enter transition', async () => {
    vi.useFakeTimers()
    const { result: roleManagement, dispose } = runInScope(() => useRoleManagement())

    try {
      await roleManagement.fetchMenuTree()
      await roleManagement.openPermissionPanel(normalRole)

      expect(roleManagement.permissionPanelRendered.value).toBe(true)
      expect(roleManagement.permissionPanelVisible.value).toBe(false)

      vi.advanceTimersByTime(20)

      expect(roleManagement.permissionPanelVisible.value).toBe(true)
    }
    finally {
      vi.useRealTimers()
      dispose()
    }
  })

  it('keeps the permission panel rendered until the close transition can finish', async () => {
    vi.useFakeTimers()
    const { result: roleManagement, dispose } = runInScope(() => useRoleManagement())

    try {
      await roleManagement.fetchMenuTree()
      await roleManagement.openPermissionPanel(normalRole)
      vi.advanceTimersByTime(20)

      expect(roleManagement.permissionPanelVisible.value).toBe(true)
      expect(roleManagement.permissionPanelRendered.value).toBe(true)

      roleManagement.closePermissionPanel()

      expect(roleManagement.permissionPanelVisible.value).toBe(false)
      expect(roleManagement.permissionPanelRendered.value).toBe(true)
      expect(roleManagement.selectedRole.value?.id).toBe(2)

      vi.advanceTimersByTime(260)

      expect(roleManagement.permissionPanelRendered.value).toBe(false)
      expect(roleManagement.selectedRole.value).toBeNull()
      expect(roleManagement.checkedMenuIds.value).toEqual([])
    }
    finally {
      vi.useRealTimers()
      dispose()
    }
  })

  it('opens the permission panel with checked menu ids from role permissions', async () => {
    vi.useFakeTimers()
    const { result: roleManagement, dispose } = runInScope(() => useRoleManagement())

    try {
      await roleManagement.fetchMenuTree()
      await roleManagement.openPermissionPanel(normalRole)
      vi.advanceTimersByTime(20)

      expect(roleManagement.permissionPanelVisible.value).toBe(true)
      expect(roleManagement.selectedRole.value?.id).toBe(2)
      expect(roleManagement.checkedMenuIds.value).toEqual([2])
    }
    finally {
      vi.useRealTimers()
      dispose()
    }
  })

  it('saves selected page permissions while preserving button permissions', async () => {
    const { result: roleManagement, dispose } = runInScope(() => useRoleManagement())

    try {
      await roleManagement.fetchMenuTree()
      roleManagement.openPermissionPanel(normalRole)

      await roleManagement.saveMenuPermissions([5])

      expect(roleApi.updateRole).toHaveBeenCalledWith(2, {
        permissions: ['user:add', 'log:login:view'],
      })
      expect(crudFeedback.notifySaveSuccess).toHaveBeenCalledWith('role.permissionSaveSuccess')
    }
    finally {
      dispose()
    }
  })
})

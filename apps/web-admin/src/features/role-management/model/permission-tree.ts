import type { MenuItem } from '@/entities/system-menu'

export interface RoleMenuPermissionNode {
  id: number
  parentId: number | null
  title: string
  path: string
  permission: string | null
  type: Extract<MenuItem['type'], 'catalog' | 'menu'>
  children?: RoleMenuPermissionNode[]
}

interface MenuPermissionSourceNode {
  id: number
  permission: string | null
  status?: number
  type?: MenuItem['type']
  children?: MenuPermissionSourceNode[]
}

type MenuPermissionSource = MenuPermissionSourceNode[]

export function createRoleMenuPermissionTree(menus: MenuItem[]): RoleMenuPermissionNode[] {
  return menus
    .filter(isActivePageMenu)
    .map((menu): RoleMenuPermissionNode => {
      const children = menu.children ? createRoleMenuPermissionTree(menu.children) : []
      return {
        id: menu.id,
        parentId: menu.parentId,
        title: menu.title,
        path: menu.path,
        permission: menu.permission,
        type: menu.type,
        ...(children.length ? { children } : {}),
      }
    })
    .filter(node => Boolean(node.permission) || Boolean(node.children?.length))
}

export function collectMenuPermissionCodes(menus: MenuPermissionSource): string[] {
  return collectPageMenuNodes(menus)
    .map(menu => menu.permission)
    .filter((permission): permission is string => Boolean(permission))
}

export function resolveCheckedMenuIdsByPermissions(
  menus: MenuPermissionSource,
  permissions: string[],
): number[] {
  const permissionSet = new Set(permissions)
  return collectPageMenuNodes(menus)
    .filter(menu => Boolean(menu.permission) && permissionSet.has(menu.permission as string))
    .map(menu => menu.id)
}

export function resolveSelectedMenuPermissionCodes(
  menus: MenuPermissionSource,
  checkedMenuIds: number[],
): string[] {
  const checkedIdSet = new Set(checkedMenuIds)
  return unique(
    collectPageMenuNodes(menus)
      .filter(menu => checkedIdSet.has(menu.id))
      .map(menu => menu.permission)
      .filter((permission): permission is string => Boolean(permission)),
  )
}

export function mergeRoleMenuPermissions(
  currentPermissions: string[],
  selectedMenuPermissionCodes: string[],
  menuPermissionCodes: string[],
): string[] {
  const menuPermissionSet = new Set(menuPermissionCodes)
  const preservedPermissions = currentPermissions.filter(permission => !menuPermissionSet.has(permission))
  return unique([...preservedPermissions, ...selectedMenuPermissionCodes])
}

function isActivePageMenu(menu: MenuItem): menu is MenuItem & { type: Extract<MenuItem['type'], 'catalog' | 'menu'> } {
  return menu.status === 1 && menu.type !== 'button'
}

function collectPageMenuNodes(menus: MenuPermissionSource): MenuPermissionSourceNode[] {
  return menus.flatMap((menu) => {
    if (menu.status !== undefined && menu.status !== 1)
      return []

    if (menu.type === 'button')
      return []

    return [menu, ...(menu.children ? collectPageMenuNodes(menu.children) : [])]
  })
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items))
}

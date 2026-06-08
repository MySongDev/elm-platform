/**
 * @file 路由权限工具
 * @domain shared/lib
 * @description 集中处理角色、按钮权限和路由 meta 的访问判断，避免权限规则散落在页面组件中。
 */

import type { RouteRecordRaw } from 'vue-router'
import type { Role } from '@/shared/config/access'

export interface RouteAccessUser {
  role?: Role
  permissions: string[]
}

interface RouteAccessTarget {
  meta?: RouteRecordRaw['meta']
}

/**
 * @description 按角色过滤路由树；无角色时返回空树，避免未登录用户看到任何受控路由。
 * @param routes 待过滤的路由树。
 * @param role 当前用户角色。
 * @returns 保留可访问节点后的浅拷贝路由树。
 * @performance O(n)，递归访问每个路由节点一次。
 */
export function filterRoutesByRole(routes: RouteRecordRaw[], role: Role | undefined): RouteRecordRaw[] {
  if (!role)
    return []
  return routes
    .filter((r) => {
      const roles = r.meta?.roles as Role[] | undefined
      return !roles || roles.includes(role)
    })
    .map((r) => {
      if (r.children) {
        return {
          ...r,
          children: filterRoutesByRole(r.children, role),
        }
      }
      return r
    })
    .filter((r) => {
      if (r.children && r.children.length === 0)
        return false
      return true
    })
}

/**
 * @description 同时按角色和权限码过滤路由树；子节点全部被过滤时父节点也会被移除。
 * @param routes 待过滤的路由树。
 * @param role 当前用户角色。
 * @param userPermissions 当前用户拥有的权限码。
 * @returns 保留可访问节点后的浅拷贝路由树。
 * @performance O(n * m)，n 为路由节点数，m 为单个路由要求的权限码数量。
 */
export function filterRoutesByAccess(
  routes: RouteRecordRaw[],
  role: Role | undefined,
  userPermissions: string[],
): RouteRecordRaw[] {
  const user: RouteAccessUser = {
    role,
    permissions: userPermissions,
  }
  return routes
    .filter(route => canAccessRoute(route, user))
    .map((r) => {
      if (r.children) {
        return {
          ...r,
          children: filterRoutesByAccess(r.children, role, userPermissions),
        }
      }
      return r
    })
    .filter((r) => {
      if (r.children && r.children.length === 0)
        return false
      return true
    })
}

/**
 * @description 判断用户是否满足单个路由的角色和权限要求；未配置 roles/auths 的路由默认放行对应维度。
 * @param route 待判断的路由或带 meta 的目标对象。
 * @param user 当前用户的角色和权限集合。
 * @returns 用户是否可以访问该路由。
 */
export function canAccessRoute(route: RouteAccessTarget, user: RouteAccessUser): boolean {
  if (!user.role)
    return false

  const roles = route.meta?.roles
  const auths = route.meta?.auths
  const rolePassed = !roles || roles.includes(user.role)
  const authPassed = !auths || auths.length === 0 || hasPermission(user.permissions, auths)

  return rolePassed && authPassed
}

/**
 * @description 判断用户权限集合是否覆盖目标权限；`*:*:*` 作为超级权限保留给管理员场景。
 * @param userPermissions 当前用户拥有的权限码。
 * @param required 单个或多个目标权限码。
 * @returns 用户是否拥有全部目标权限。
 */
export function hasPermission(userPermissions: string[], required: string | string[]): boolean {
  if (!userPermissions)
    return false

  if (userPermissions.includes('*:*:*'))
    return true

  const requiredList = Array.isArray(required) ? required : [required]
  return requiredList.every(p => userPermissions.includes(p))
}

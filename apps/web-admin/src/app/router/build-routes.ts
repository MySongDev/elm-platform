/**
 * @file 动态路由构建器
 * @domain router
 * @description 隔离后端菜单协议和 Vue Router 记录结构，避免后端字段直接污染运行时路由构建。
 */

import type { RouteRecordRaw } from 'vue-router'
import type { RouteMenuNode } from './types/route-menu.types'
import type { UserMenuNode } from '@/entities/session'
import { resolveRouteComponentKey } from './component/component-key'
import { layoutComponent, resolveComponent } from './component/component-map'
import { adaptBackendMenusToRouteMenus } from './menu/menu-adapter'
import { normalizeMenuTree } from './menu/menu-schema'
import { normalizePath } from './utils'

/**
 * 后端菜单节点（GET /auth/menus 返回的树形结构）
 */
export type BackendMenuNode = UserMenuNode

function joinPath(parentPath: string, path: string): string {
  return normalizePath(`${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`)
}

function resolveFullPath(path: string, parentFullPath?: string): string {
  if (path.startsWith('/'))
    return normalizePath(path)

  return joinPath(parentFullPath ?? '', path)
}

function resolveRoutePath(path: string, fullPath: string, parentFullPath?: string): string {
  if (!parentFullPath)
    return fullPath

  const normalizedParent = normalizePath(parentFullPath)
  if (fullPath.startsWith(`${normalizedParent}/`))
    return fullPath.slice(normalizedParent.length + 1)

  return path.startsWith('/') ? fullPath : path
}

/**
 * @description 将后端菜单树转换为 Vue Router 动态路由；入口处先做协议清洗和适配，保证后续构建只依赖前端内部模型。
 * @param menus 后端返回的菜单树。
 * @returns 可直接注册到 Vue Router 的动态路由记录。
 * @performance O(n log n)，每一层菜单会按 order 排序；后台菜单规模通常较小，递归构建成本可接受。
 */
export function buildRoutes(menus: BackendMenuNode[]): RouteRecordRaw[] {
  return buildRoutesFromRouteMenus(
    adaptBackendMenusToRouteMenus(filterEnabled(normalizeMenuTree(menus))),
  )
}

/**
 * @description 将前端内部菜单模型转换为 Vue Router 记录；调用方必须先完成后端协议适配。
 * @param menus 前端内部路由菜单树。
 * @returns 可直接注册到 Vue Router 的动态路由记录。
 * @performance O(n log n)，每一层菜单会独立排序并递归构建子路由。
 */
export function buildRoutesFromRouteMenus(menus: RouteMenuNode[]): RouteRecordRaw[] {
  return menus
    .map(menu => buildRouteNode(menu))
    .filter((route): route is RouteRecordRaw => route !== null)
    .sort(sortRoutes)
}

/** 递归过滤 status !== 1 的禁用菜单 */
function filterEnabled(menus: BackendMenuNode[]): BackendMenuNode[] {
  return menus
    .filter(menu => menu.status === 1)
    .map(menu => ({
      ...menu,
      children: menu.children ? filterEnabled(menu.children) : undefined,
    }))
}

function buildRouteNode(
  menu: RouteMenuNode,
  parentFullPath?: string,
): RouteRecordRaw | null {
  const fullPath = resolveFullPath(menu.path, parentFullPath)
  const routePath = resolveRoutePath(menu.path, fullPath, parentFullPath)
  const children = (menu.children?.map(child => buildRouteNode(child, fullPath))
    .filter((route): route is RouteRecordRaw => route !== null)
    .sort(sortRoutes)) ?? []

  const meta: RouteRecordRaw['meta'] = {
    title: menu.title ?? '',
    ...(menu.icon !== undefined ? { icon: menu.icon } : {}),
    ...(menu.auths !== undefined ? { auths: menu.auths } : {}),
    ...(menu.order !== undefined ? { order: menu.order } : {}),
    ...(menu.cacheName !== undefined ? { cacheName: menu.cacheName } : {}),
    ...(menu.hidden !== undefined ? { hidden: menu.hidden } : {}),
  }

  if (menu.children?.length) {
    const redirect = resolveFirstReachablePath(children ?? [], fullPath)
    const shouldAlwaysShow = (children?.length ?? 0) > 1 || children?.some(child => child.children?.length)
    const catalogMeta = shouldAlwaysShow
      ? {
          ...meta,
          alwaysShow: true,
        }
      : meta

    if (!parentFullPath) {
      return {
        path: routePath,
        component: layoutComponent,
        redirect,
        meta: catalogMeta,
        children,
      }
    }

    return {
      path: routePath,
      redirect,
      meta: catalogMeta,
      children,
    }
  }

  if (menu.children) {
    return null
  }

  const componentKey = resolveRouteComponentKey(fullPath, menu.component)
  return {
    path: routePath,
    name: menu.name ?? undefined,
    component: resolveComponent(componentKey),
    meta,
  }
}

function sortRoutes(a: RouteRecordRaw, b: RouteRecordRaw): number {
  return (a.meta?.order ?? 99) - (b.meta?.order ?? 99)
}

function resolveFirstReachablePath(
  routes: RouteRecordRaw[],
  parentFullPath: string,
): string | undefined {
  const firstRoute = routes[0]
  if (!firstRoute)
    return undefined

  if (typeof firstRoute.redirect === 'string')
    return firstRoute.redirect

  const fullPath = firstRoute.path.startsWith('/')
    ? normalizePath(firstRoute.path)
    : joinPath(parentFullPath, firstRoute.path)

  if (firstRoute.children?.length)
    return resolveFirstReachablePath(firstRoute.children, fullPath)

  return fullPath
}

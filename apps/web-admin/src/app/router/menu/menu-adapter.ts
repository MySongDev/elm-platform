/**
 * @file 后端菜单协议适配器
 * @domain router
 * @description 将后端菜单字段转换为前端内部 RouteMenuNode，后端协议变化应优先收敛在这一层。
 */

import type { BackendMenuNode } from '../build-routes'
import type { RouteMenuNode } from '../types/route-menu.types'
import { resolveKnownRouteTitleKey, resolveRouteTitleFallback } from './route-title-map'

/**
 * @description 将已清洗的后端菜单树适配为前端内部路由菜单；空白标题在这里回退到历史映射，兼容旧菜单数据。
 * @param menus 后端菜单树。
 * @returns 前端内部 RouteMenuNode 树。
 * @performance O(n)，仅递归访问每个菜单节点一次。
 */
export function adaptBackendMenusToRouteMenus(menus: BackendMenuNode[]): RouteMenuNode[] {
  return menus.map(menu => adaptBackendMenuToRouteMenu(menu))
}

function adaptBackendMenuToRouteMenu(menu: BackendMenuNode): RouteMenuNode {
  const title = resolveKnownRouteTitleKey(menu.name ?? undefined)
    ?? menu.title?.trim()
    ?? resolveRouteTitleFallback(menu.name ?? undefined, menu.path)

  return {
    path: menu.path,
    ...(menu.name ? { name: menu.name } : {}),
    ...(menu.component ? { component: menu.component } : {}),
    title,
    ...(menu.icon ? { icon: menu.icon } : {}),
    ...(menu.sort !== undefined ? { order: menu.sort } : {}),
    ...(menu.permission ? { auths: [menu.permission] } : {}),
    ...(menu.name ? { cacheName: menu.name } : {}),
    ...(menu.children ? { children: adaptBackendMenusToRouteMenus(menu.children) } : {}),
  }
}

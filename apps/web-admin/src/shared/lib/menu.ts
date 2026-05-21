/**
 * @file 菜单路由工具
 * @domain shared/lib
 * @description 将路由树转换为展示菜单需要的扁平结构，并统一处理父子路径拼接。
 */

import type { RouteRecordRaw } from 'vue-router'

export interface FlatRoute {
  path: string
  title: string
  icon?: string
  parentIcon?: string
}

/**
 * @description 将可见路由叶子节点展开为菜单项；父级图标会向下传递，保证无图标叶子仍可继承分组视觉。
 * @param routes 待展开的路由树。
 * @param translate 路由标题翻译函数。
 * @param parentIcon 上级路由图标。
 * @param basePath 当前递归层级的基础路径。
 * @returns 可直接用于菜单展示的扁平路由列表。
 * @performance O(n)，递归访问每个路由节点一次。
 */
export function flattenRoutes(
  routes: readonly RouteRecordRaw[],
  translate: (message: any) => string,
  parentIcon?: string,
  basePath = '',
): FlatRoute[] {
  const result: FlatRoute[] = []

  for (const route of routes) {
    const meta = route.meta
    if (meta?.hidden || !meta?.title)
      continue

    const icon = (meta.icon as string) || parentIcon
    const children = route.children
    const fullPath = resolveRoutePath(basePath, route.path)

    if (children && children.length > 0) {
      result.push(...flattenRoutes(children, translate, icon, fullPath))
    }
    else {
      result.push({
        path: fullPath,
        title: translate(meta.title),
        icon,
        parentIcon,
      })
    }
  }

  return result
}

/**
 * @description 解析父子路由路径；子路径为绝对路径时保持原值，兼容 Vue Router 的绝对子路由写法。
 * @param basePath 父级完整路径。
 * @param routePath 当前路由 path。
 * @returns 当前路由的完整路径。
 */
export function resolveRoutePath(basePath: string, routePath: string): string {
  if (routePath.startsWith('/'))
    return routePath
  if (basePath.endsWith('/'))
    return `${basePath}${routePath}`
  return `${basePath}/${routePath}`
}

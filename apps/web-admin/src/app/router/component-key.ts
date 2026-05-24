/**
 * @file 路由组件键解析
 * @domain router
 * @description 收敛后端历史菜单路径与本地页面目录的兼容映射，避免动态路由命中 404。
 */

const routeComponentKeyAliases: Record<string, string> = {
  'monitor/online-user': 'monitor/online',
  'monitor/login-logs': 'monitor/logs/login',
  'monitor/operation-logs': 'monitor/logs/operation',
  'monitor/system-logs': 'monitor/logs/system',
}

function normalizeComponentKey(key: string): string {
  return key
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/index(?:\.vue)?$/, '')
    .replace(/\.vue$/, '')
}

function resolveAlias(key: string): string {
  return routeComponentKeyAliases[key] ?? key
}

/**
 * @description 解析路由最终使用的页面组件键；显式 component 优先，历史路径走别名兜底。
 * @param fullPath 当前菜单完整路由路径。
 * @param component 后端显式下发的页面组件键。
 * @returns 可交给 component-map 查找的本地页面组件键。
 */
export function resolveRouteComponentKey(fullPath: string, component?: string): string {
  const explicitKey = component?.trim()

  if (explicitKey)
    return resolveAlias(normalizeComponentKey(explicitKey))

  const pathKey = normalizeComponentKey(fullPath)
  return resolveAlias(pathKey)
}

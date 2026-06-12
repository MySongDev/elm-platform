/**
 * @file 路由标题兜底映射
 * @domain router
 * @description 保留旧菜单 name 到 i18n key 的兼容映射；已知内置菜单应优先保留 key，避免后端固定文案破坏语言切换。
 */

const routeTitleKeyByName: Record<string, string> = {
  Dashboard: 'route.dashboard',
  DashboardView: 'route.dashboard',
  Permission: 'route.permissionManagement',
  PagePermission: 'route.pagePermission',
  ButtonPermission: 'route.buttonPermission',
  Monitor: 'route.systemMonitor',
  OnlineUser: 'route.onlineUser',
  LoginLogs: 'route.loginLog',
  OperationLogs: 'route.operationLog',
  SystemLogs: 'route.systemLog',
  System: 'route.systemManagement',
  UserList: 'route.userList',
  RoleManagement: 'route.roleManagement',
  MenuManagement: 'route.menuManagement',
  DeptManagement: 'route.deptManagement',
  Commerce: 'route.commerceManagement',
  CommerceRestaurantView: 'route.restaurantManagement',
  CommerceFoodView: 'route.foodManagement',
  CommerceOrderView: 'route.orderManagement',
  Platform: 'route.platformManagement',
  TenantListView: 'route.tenantManagement',
  Nested: 'route.nestedMenu',
  NestedMenu1: 'route.menu1',
  NestedMenu11View: 'route.menu11',
  NestedMenu12: 'route.menu12',
  NestedMenu121View: 'route.menu121',
  NestedMenu122View: 'route.menu122',
  NestedMenu13View: 'route.menu13',
  NestedMenu2View: 'route.menu2',
}

function normalizeTitleSegment(path: string): string {
  const segment = path.split('/').filter(Boolean).at(-1) ?? path
  return segment.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

export function resolveKnownRouteTitleKey(name: string | undefined): string | undefined {
  return routeTitleKeyByName[name ?? '']
}

/**
 * @description 根据历史 route name 映射或路径片段生成标题兜底值；只应在后端 title 缺失或空白时调用。
 * @param name 后端菜单 name，可为空。
 * @param path 后端菜单 path，用于 name 无映射时推导 `route.xxx`。
 * @returns 可写入 route meta.title 的 i18n key。
 */
export function resolveRouteTitleFallback(name: string | undefined, path: string): string {
  return resolveKnownRouteTitleKey(name) ?? `route.${normalizeTitleSegment(path)}`
}

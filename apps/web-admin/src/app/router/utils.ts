/**
 * @file 路由路径工具
 * @domain router
 * @description 提供路由层共享的路径归一化能力，避免动态菜单路径拼接产生重复斜杠或空路径。
 */

/** 默认首页路径 */
export const DEFAULT_HOME_PATH = '/dashboard/index'

/** 登录页路径 */
export const LOGIN_PATH = '/login'

/** 无权限页路径 */
export const FORBIDDEN_PATH = '/403'

/** 服务异常页路径 */
export const SERVER_ERROR_PATH = '/500'

/**
 * @description 规范化路由路径；动态菜单路径拼接可能产生重复斜杠或空字符串，统一在这里收敛。
 * @param path 待规范化的路由路径。
 * @returns 去除重复斜杠和尾部斜杠后的路径，空结果会回退为 `/`。
 */
export function normalizePath(path: string): string {
  const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '')
  return normalized || '/'
}

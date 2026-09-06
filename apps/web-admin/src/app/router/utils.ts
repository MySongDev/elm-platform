/**
 * @file 路由路径工具
 * @domain router
 * @description 提供路由层共享的路径归一化能力，避免动态菜单路径拼接产生重复斜杠或空路径。
 */

/**
 * @description 规范化路由路径；动态菜单路径拼接可能产生重复斜杠或空字符串，统一在这里收敛。
 * @param path 待规范化的路由路径。
 * @returns 去除重复斜杠和尾部斜杠后的路径，空结果会回退为 `/`。
 */
export function normalizePath(path: string): string {
  const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '')
  return normalized || '/'
}

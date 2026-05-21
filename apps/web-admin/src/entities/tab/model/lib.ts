/**
 * @file 页签规则工具
 * @domain entities/tab
 * @description 集中处理路由到页签的映射、首页固定规则和缓存名称解析，避免布局组件重复理解页签协议。
 */

import type { RouteLocationNormalized } from 'vue-router'
import type { TabItem } from './types'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'

/**
 * @description 判断页签是否代表系统首页；首页不允许被关闭，且需要固定在首位。
 * @param tab 待判断的页签。
 * @returns 是否为首页页签。
 */
export function isHomeTab(tab: TabItem): boolean {
  return tab.path === DEFAULT_HOME_PATH || tab.fullPath === DEFAULT_HOME_PATH
}

/**
 * @description 判断页签是否允许关闭；固定页签和首页页签会作为导航锚点保留。
 * @param tab 待判断的页签。
 * @returns 是否允许关闭。
 */
export function isTabClosable(tab: TabItem): boolean {
  return !tab.fixed && !isHomeTab(tab)
}

/**
 * @description 将首页页签移动到首位；已经在首位或不存在首页时返回原数组引用，避免不必要的状态更新。
 * @param tabs 当前页签数组。
 * @returns 首页在首位的页签数组。
 */
export function moveHomeTabFirst(tabs: TabItem[]): TabItem[] {
  const homeIndex = tabs.findIndex(isHomeTab)
  if (homeIndex <= 0)
    return tabs

  const orderedTabs = [...tabs]
  const homeTab = orderedTabs.splice(homeIndex, 1)[0]
  if (!homeTab)
    return tabs

  return [homeTab, ...orderedTabs]
}

/**
 * @description 解析页签唯一键；允许路由通过 meta.tabKey 合并多个 URL 到同一个页签。
 * @param route 当前路由对象。
 * @returns 页签唯一键。
 */
export function resolveTabKey(route: RouteLocationNormalized): string {
  return (route.meta?.tabKey as string | undefined) || route.fullPath
}

/**
 * @description 解析 KeepAlive 缓存名称；meta.keepAlive 为 false 时显式跳过缓存。
 * @param route 当前路由对象。
 * @returns 可传给 KeepAlive include 的组件缓存名称。
 */
export function resolveCacheName(route: RouteLocationNormalized): string | undefined {
  if (route.meta?.keepAlive === false)
    return undefined

  return (route.meta?.cacheName as string | undefined)
    || (route.name as string | undefined)
}

/**
 * @description 将 Vue Router 路由对象转换为页签模型；这里是路由 meta 与页签状态之间的唯一映射边界。
 * @param route 当前路由对象。
 * @returns 可写入页签 store 的页签项。
 */
export function routeToTab(route: RouteLocationNormalized): TabItem {
  const meta = route.meta ?? {}
  const cacheName = resolveCacheName(route)
  return {
    key: resolveTabKey(route),
    path: route.path,
    fullPath: route.fullPath,
    title: (meta.title as string) ?? route.path,
    icon: meta.icon as string | undefined,
    fixed: !!meta.fixedTag,
    cacheName,
    name: cacheName,
  }
}

/**
 * @description 读取页签匹配键；兼容旧数据里可能缺失 key 的页签记录。
 * @param tab 待读取的页签。
 * @returns 页签匹配键。
 */
export function getTabKey(tab: TabItem): string {
  return tab.key || tab.fullPath
}

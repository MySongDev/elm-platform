/**
 * @file 动态路由注册器
 * @domain router
 * @description 管理登录后动态路由和兜底 404 路由的注册生命周期，确保权限变化时可以清理旧路由。
 */

import type { Router, RouteRecordRaw } from 'vue-router'
import { notFoundRoute } from './routes/error'

let removeDynamicRouteHandlers: Array<() => void> = []

/**
 * @description 有副作用：向 Vue Router 注册新的动态路由和兜底 404，并在注册前移除上一批动态路由。
 * @param router 当前应用的 Vue Router 实例。
 * @param routes 根据用户菜单构建出的动态路由记录。
 */
export function registerDynamicRoutes(router: Router, routes: RouteRecordRaw[]) {
  resetDynamicRoutes()

  for (const route of routes) {
    removeDynamicRouteHandlers.push(router.addRoute(route))
  }

  removeDynamicRouteHandlers.push(router.addRoute(notFoundRoute))
}

/**
 * @description 有副作用：执行已注册动态路由的移除函数，并清空本模块保存的路由移除句柄。
 */
export function resetDynamicRoutes() {
  removeDynamicRouteHandlers.forEach(removeRoute => removeRoute())
  removeDynamicRouteHandlers = []
}

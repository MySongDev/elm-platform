/**
 * @file 静态路由出口
 * @domain app/router
 * @description 聚合默认重定向、认证页、错误页和独立布局页面，作为 Router 初始化的静态路由表。
 */

import type { RouteRecordRaw } from 'vue-router'
import { DEFAULT_HOME_PATH } from '@/shared/config/paths'
import { authRoutes } from './auth'
import { errorRoutes } from './error'
import { standaloneRoutes } from './standalone'

export { notFoundRoute } from './error'

export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: DEFAULT_HOME_PATH,
  },
  ...authRoutes,
  ...errorRoutes,
  ...standaloneRoutes,
]

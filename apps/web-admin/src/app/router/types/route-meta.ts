/**
 * @file Vue Router Meta 类型扩展
 * @domain app/router
 * @description 为路由 meta 补充菜单、权限、缓存和标签页相关字段，约束动态路由与布局组件之间的协议。
 */

import type { Role } from '@/shared/config/access'
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string | Record<string, string>
    icon?: string
    hidden?: boolean
    requiresAuth?: boolean
    roles?: Role[]
    auths?: string[]
    keepAlive?: boolean
    cacheName?: string
    tabKey?: string
    alwaysShow?: boolean
    order?: number
    hiddenTag?: boolean
    fixedTag?: boolean
    activePath?: string
    parentRoute?: string
  }
}

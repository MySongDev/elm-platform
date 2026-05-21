/**
 * @file 路由守卫管线
 * @domain app/router
 * @description 有副作用：按固定顺序注册进度条、资源重试、认证、动态路由、权限和标签页同步守卫。
 */

import type { Router } from 'vue-router'
import { setupAuthGuard } from './authGuard'
import { setupChunkErrorGuard } from './chunkErrorGuard'
import { setupDynamicRouteGuard } from './dynamicRouteGuard'
import { setupPermissionGuard } from './permissionGuard'
import { setupProgressGuard } from './progressGuard'
import { setupTabSyncGuard } from './tabSyncGuard'

/**
 * @description 注册顺序即执行优先级：先处理导航生命周期，再处理认证和权限，最后同步页面副作用。
 */
export function setupGuards(router: Router) {
  setupProgressGuard(router)
  setupChunkErrorGuard(router)
  setupAuthGuard(router)
  setupDynamicRouteGuard(router)
  setupPermissionGuard(router)
  setupTabSyncGuard(router)
}

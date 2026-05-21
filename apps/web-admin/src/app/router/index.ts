/**
 * @file Vue Router 实例
 * @domain app/router
 * @description 有副作用：创建 Hash Router，注册静态路由和全局守卫管线。
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import { setupGuards } from './guards/index'
import { staticRoutes } from './routes/index'
import './types'

const router = createRouter({
  history: createWebHashHistory(),
  routes: staticRoutes,
  scrollBehavior() {
    return { top: 0 }
  },
})

setupGuards(router)

export default router

/**
 * @file 路由进度条守卫
 * @domain app/router
 * @description 有副作用：在路由切换开始和结束时驱动 NProgress。
 */

import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

export function setupProgressGuard(router: Router) {
  router.beforeEach(() => {
    NProgress.start()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}

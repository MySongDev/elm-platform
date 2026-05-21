/**
 * @file 异步路由加载失败守卫
 * @domain app/router
 * @description 有副作用：捕获动态 import chunk 加载失败并对同一路径自动重试一次。
 */

import type { Router } from 'vue-router'
import NProgress from 'nprogress'

/**
 * @description 识别常见浏览器和构建工具在 chunk 失效时抛出的动态导入错误。
 */
function isAsyncRouteLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return [
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'error loading dynamically imported module',
    'Load failed',
  ].some(keyword => message.includes(keyword))
}

export function setupChunkErrorGuard(router: Router) {
  router.onError((error, to) => {
    NProgress.done()

    if (!isAsyncRouteLoadError(error))
      return

    const retryKey = `route-retry:${to.fullPath}`

    if (sessionStorage.getItem(retryKey))
      return

    sessionStorage.setItem(retryKey, '1')
    router.replace(to.fullPath)
  })
}

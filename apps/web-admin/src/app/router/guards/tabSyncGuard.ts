/**
 * @file 标签页同步守卫
 * @domain app/router
 * @description 有副作用：路由切换完成后同步 document.title、标签页状态和异步路由重试标记。
 */

import type { Router } from 'vue-router'
import { useTabsStore } from '@/entities/tab'
import { transformI18n } from '@/shared/i18n'

export function setupTabSyncGuard(router: Router) {
  router.afterEach((to) => {
    sessionStorage.removeItem(`route-retry:${to.fullPath}`)

    document.title = transformI18n(to.meta.title) || import.meta.env.VITE_APP_TITLE || 'Elm Admin'

    if (to.meta.title && !to.meta.hiddenTag) {
      const tabsStore = useTabsStore()
      tabsStore.addTab(to)
    }
  })
}

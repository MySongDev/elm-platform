import type { RouteRecordRaw } from 'vue-router'

import { createRouter, createWebHashHistory } from 'vue-router'
import { pinia } from '@/stores'

import { useUserStore } from '@/stores/modules/store-user'
import NProgress from '../untils/NProgress/nprogress'
import './types'

const modules = import.meta.glob('./modules/*.ts', {
  eager: true,
  import: 'default',
})

const routes = Object.values(modules).flatMap((module) => {
  return Array.isArray(module) ? module : [module]
}) as RouteRecordRaw[]

const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: [...routes, ...constantRoutes],
  scrollBehavior() {
    return { top: 0 }
  },
})

function isAuthenticated(): boolean {
  const userStore = useUserStore(pinia)
  return Boolean(
    userStore.isLogin
    || userStore.userId,
  )
}

router.beforeEach((to, _from, next) => {
  NProgress.start()
  document.title = to.meta.title as string

  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router

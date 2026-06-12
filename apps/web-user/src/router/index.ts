import type { RouteRecordRaw } from 'vue-router'

import { createRouter, createWebHashHistory } from 'vue-router'
import { pinia } from '@/stores'

import { useUserStore } from '@/stores/modules/store-user'
import NProgress from '../utils/NProgress/nprogress'
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
  return userStore.syncAuthSessionFromStorage()
}

function getFirstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

function resolveLoginRedirect(redirect: unknown) {
  const target = getFirstQueryValue(redirect)
  if (typeof target !== 'string' || !target || target.startsWith('/login')) {
    return '/home'
  }
  return target
}

router.beforeEach((to, _from, next) => {
  NProgress.start()
  document.title = to.meta.title as string

  if (to.path === '/login' && isAuthenticated()) {
    next(resolveLoginRedirect(to.query.redirect))
    return
  }

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

/**
 * @file 错误页静态路由
 * @domain app/router
 * @description 定义 403、404、500 和兜底重定向路由，不参与侧边栏和标签页展示。
 */

import type { RouteRecordRaw } from 'vue-router'
import { $t } from '@/shared/i18n'

export const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/pages/error/403.vue'),
    meta: {
      title: $t('route.forbidden'),
      requiresAuth: false,
      hidden: true,
      hiddenTag: true,
    },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/pages/error/404.vue'),
    meta: {
      title: $t('route.notFound'),
      requiresAuth: false,
      hidden: true,
      hiddenTag: true,
    },
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/pages/error/500.vue'),
    meta: {
      title: $t('route.serverError'),
      requiresAuth: false,
      hidden: true,
      hiddenTag: true,
    },
  },
]

export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  redirect: '/404',
  meta: {
    requiresAuth: false,
    hidden: true,
    hiddenTag: true,
  },
}

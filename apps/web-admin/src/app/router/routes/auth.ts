/**
 * @file 认证静态路由
 * @domain app/router
 * @description 定义登录页等认证相关公开路由，不参与侧边栏和标签页展示。
 */

import type { RouteRecordRaw } from 'vue-router'
import { $t } from '@/shared/i18n'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/index.vue'),
    meta: {
      title: $t('route.login'),
      requiresAuth: false,
      hidden: true,
      hiddenTag: true,
    },
  },
]

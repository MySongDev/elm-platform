/**
 * @file 独立布局静态路由
 * @domain app/router
 * @description 定义不挂载全局 AdminLayout 的页面路由，例如账号设置页内部自带侧边栏。
 */

import type { RouteRecordRaw } from 'vue-router'
import { $t } from '@/shared/i18n'

export const standaloneRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    redirect: '/account/settings',
    meta: {
      title: $t('route.accountSettings'),
      hidden: true,
    },
    children: [
      {
        path: 'settings',
        name: 'AccountSettings',
        component: () => import('@/pages/account/settings.vue'),
        meta: {
          title: $t('route.accountSettings'),
          hidden: true,
        },
      },
    ],
  },
]

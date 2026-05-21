import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/shop',
  name: 'Shop',
  component: () => import('@/views/shop/shop.vue'),
  meta: {
    title: '商家',
    requiresAuth: true,
  },
} satisfies RouteRecordRaw

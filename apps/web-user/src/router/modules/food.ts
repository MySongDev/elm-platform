import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/food',
  name: 'Food',
  component: () => import('@/views/food/food.vue'),
  meta: {
    title: '食物',
    keepAlive: true,
    requiresAuth: true,
  },
} satisfies RouteRecordRaw

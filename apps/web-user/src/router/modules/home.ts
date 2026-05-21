import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/home',
  name: 'Home',
  component: () => import('@/views/home/home.vue'),
  meta: {
    title: '',
  },
} satisfies RouteRecordRaw

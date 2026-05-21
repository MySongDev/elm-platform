import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/download',
  name: 'DownLoad',
  component: () => import('@/views/download/download.vue'),
} satisfies RouteRecordRaw

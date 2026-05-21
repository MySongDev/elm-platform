import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/list',
  component: () => import('@/views/v-list.vue'),
} satisfies RouteRecordRaw

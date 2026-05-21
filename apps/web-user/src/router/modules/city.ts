import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/city',
  redirect: '/city/1',
  meta: {
    title: '城市选择',
  },
  children: [
    {
      path: ':id',
      name: 'City',
      component: () => import('@/views/city/city.vue'),
      meta: {
        title: '城市详情',
      },
    },
  ],
} satisfies RouteRecordRaw

import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/forget',
  children: [
    {
      path: '',
      name: 'Forget',
      component: () => import('@/views/forget/forget.vue'),
      meta: {
        title: '忘记密码',
      },
    },
  ],
} satisfies RouteRecordRaw

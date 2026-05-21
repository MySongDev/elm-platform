import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/login/login.vue'),
  meta: {
    title: '登录',
  },
} satisfies RouteRecordRaw

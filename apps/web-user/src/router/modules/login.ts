import type { RouteRecordRaw } from 'vue-router'

export default [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/login.vue'),
    meta: {
      title: '登录',
    },
  },
  {
    path: '/login/sms-verification',
    name: 'SmsVerification',
    component: () => import('@/views/login/SmsVerification.vue'),
    meta: {
      title: '短信验证码',
    },
  },
] satisfies RouteRecordRaw[]

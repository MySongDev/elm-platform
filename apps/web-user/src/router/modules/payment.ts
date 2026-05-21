import type { RouteRecordRaw } from 'vue-router'

export default [
  {
    path: '/payment',
    name: 'ShopPayment',
    component: () => import('@/views/payment/payment.vue'),
    meta: {
      title: '在线支付',
      requiresAuth: true,
    },
  },
  {
    path: '/payment/result',
    name: 'PaymentResult',
    component: () => import('@/views/payment/PaymentResult.vue'),
    meta: {
      title: '支付结果',
      requiresAuth: true,
    },
  },
] satisfies RouteRecordRaw[]

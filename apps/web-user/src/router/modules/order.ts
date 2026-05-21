import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/order',
  component: () => import('@/layout/AddressLayout.vue'),
  children: [
    {
      path: '',
      name: 'Order',
      component: () => import('@/views/order/order.vue'),
      meta: {
        title: '我的订单',
      },
    },
  ],
} satisfies RouteRecordRaw

import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/profile/address',
  component: () => import('@/layout/AddressLayout.vue'),
  children: [
    {
      path: '',
      name: 'AddressHome',
      component: () => import('@/views/profile/address/addressHome.vue'),
      meta: {
        title: '收货地址',
        requiresAuth: true,
        hideLayoutHeader: true,
      },
    },
    {
      path: 'add',
      name: 'AddressAdd',
      component: () => import('@/views/profile/address/add/AddressAdd.vue'),
      meta: {
        title: '添加地址',
        requiresAuth: true,
      },
    },
    {
      path: 'addDatil',
      name: 'AddressDatil',
      component: () => import('@/views/profile/address/add/AddressDatil.vue'),
      meta: { requiresAuth: true },
    },
  ],
} satisfies RouteRecordRaw

import type { RouteRecordRaw } from 'vue-router'

export default {
  path: '/',
  name: 'NavbarLayout',
  component: () => import('@/layout/NavbarLayout.vue'),
  redirect: '/msite',
  meta: { keepAlive: true },
  children: [
    {
      path: 'msite',
      name: 'Msite',
      component: () => import('@/views/msite/msite.vue'),
      meta: {
        title: '外卖',
        keepAlive: true,
      },
    },
    {
      path: 'search',
      name: 'SearchHome',
      component: () => import('@/views/search/SearchHome.vue'),
      meta: {
        title: '搜索',
        keepAlive: true,
      },
    },
    {
      path: 'cart',
      name: 'CartDetail',
      component: () => import('@/views/cart/cart.vue'),
      meta: {
        title: '购物车',
        keepAlive: true,
      },
    },
    {
      path: 'profile',
      name: 'Profile',
      component: () => import('@/views/profile/profile.vue'),
      meta: {
        title: '我的',
        keepAlive: true,
      },
    },
  ],
} satisfies RouteRecordRaw

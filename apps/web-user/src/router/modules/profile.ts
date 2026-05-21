import type { RouteRecordRaw } from 'vue-router'

export default [
  {
    path: '/profile/info',
    component: () => import('@/layout/AddressLayout.vue'),
    children: [
      {
        path: '',
        name: 'Info',
        component: () => import('@/views/profile/info/info.vue'),
        meta: {
          title: '账户信息',
          requiresAuth: true,
        },
      },
      {
        path: 'setusername',
        name: 'SetUserName',
        component: () => import('@/views/profile/info/setusername.vue'),
        meta: {
          title: '修改用户名',
          requiresAuth: true,
        },
      },
    ],
  },
] satisfies RouteRecordRaw[]

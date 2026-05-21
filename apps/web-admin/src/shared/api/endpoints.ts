export const authEndpoints = {
  login: '/auth/login',
  logout: '/auth/logout',
  profile: '/auth/profile',
  menus: '/auth/menus',
  securityLogs: '/auth/security-logs',
} as const

export const userEndpoints = {
  list: '/users',
  detail: (id: number) => `/users/${id}`,
  create: '/users',
  update: (id: number) => `/users/${id}`,
  delete: (id: number) => `/users/${id}`,
} as const

export const adminEndpoints = {
  permissions: {
    pages: '/admin/permissions/pages',
    buttons: '/admin/permissions/buttons',
  },
  monitor: {
    onlineUsers: '/admin/monitor/online-users',
    forceLogout: (id: number) => `/admin/monitor/online-users/${id}/force-logout`,
    loginLogs: '/admin/monitor/login-logs',
    operationLogs: '/admin/monitor/operation-logs',
    systemLogs: '/admin/monitor/system-logs',
  },
  system: {
    roles: '/admin/system/roles',
    roleDetail: (id: number) => `/admin/system/roles/${id}`,
    menus: '/admin/system/menus',
    menuDetail: (id: number) => `/admin/system/menus/${id}`,
    depts: '/admin/system/depts',
    deptDetail: (id: number) => `/admin/system/depts/${id}`,
  },
  commerce: {
    restaurants: '/admin/commerce/restaurants',
    restaurantDetail: (id: number) => `/admin/commerce/restaurants/${id}`,
    foods: '/admin/commerce/foods',
    foodDetail: (id: number) => `/admin/commerce/foods/${id}`,
    orders: '/admin/commerce/orders',
    orderDetail: (id: number) => `/admin/commerce/orders/${id}`,
  },
} as const

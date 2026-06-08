/** 角色类型 */
export type Role = 'admin' | 'user'

/** 所有角色 */
export const ALL_ROLES: Role[] = ['admin', 'user']

/** 仅管理员 */
export const ADMIN_ONLY: Role[] = ['admin']

/** 按钮级权限码 */
export const Permissions = {
  PERMISSION_PAGE: 'permission:page:view',
  PERMISSION_BUTTON: 'permission:button:view',
  USER_VIEW: 'user:view',
  USER_ADD: 'user:add',
  USER_DELETE: 'user:delete',
  USER_EDIT: 'user:edit',
  ROLE_VIEW: 'role:view',
  ROLE_ADD: 'role:add',
  ROLE_EDIT: 'role:edit',
  ROLE_DELETE: 'role:delete',
  MENU_VIEW: 'menu:view',
  MENU_ADD: 'menu:add',
  MENU_EDIT: 'menu:edit',
  MENU_DELETE: 'menu:delete',
  DEPT_VIEW: 'dept:view',
  DEPT_ADD: 'dept:add',
  DEPT_EDIT: 'dept:edit',
  DEPT_DELETE: 'dept:delete',
  COMMERCE_RESTAURANT_VIEW: 'commerce:restaurant:view',
  COMMERCE_RESTAURANT_ADD: 'commerce:restaurant:add',
  COMMERCE_RESTAURANT_EDIT: 'commerce:restaurant:edit',
  COMMERCE_RESTAURANT_DELETE: 'commerce:restaurant:delete',
  COMMERCE_FOOD_VIEW: 'commerce:food:view',
  COMMERCE_FOOD_ADD: 'commerce:food:add',
  COMMERCE_FOOD_EDIT: 'commerce:food:edit',
  COMMERCE_FOOD_DELETE: 'commerce:food:delete',
  COMMERCE_ORDER_VIEW: 'commerce:order:view',
  COMMERCE_ORDER_ACCEPT: 'commerce:order:accept',
  COMMERCE_ORDER_PREPARE: 'commerce:order:prepare',
  COMMERCE_ORDER_DELIVER: 'commerce:order:deliver',
  COMMERCE_ORDER_COMPLETE: 'commerce:order:complete',
  COMMERCE_ORDER_REFUND_APPROVE: 'commerce:order:refund:approve',
  COMMERCE_ORDER_REFUND_REJECT: 'commerce:order:refund:reject',
  COMMERCE_ORDER_EDIT: 'commerce:order:edit',
  MONITOR_ONLINE: 'monitor:online:view',
  MONITOR_ONLINE_FORCE_LOGOUT: 'monitor:online:force-logout',
  LOG_LOGIN: 'log:login:view',
  LOG_OPERATION: 'log:operation:view',
  LOG_SYSTEM: 'log:system:view',
  PLATFORM_TENANT_VIEW: 'platform:tenant:view',
  PLATFORM_TENANT_CREATE: 'platform:tenant:create',
  PLATFORM_TENANT_UPDATE: 'platform:tenant:update',
  PLATFORM_TENANT_TRANSITION: 'platform:tenant:transition',
  MERCHANT_ONBOARDING_VIEW: 'merchant:onboarding:view',
  MERCHANT_ONBOARDING_REVIEW: 'merchant:onboarding:review',
  MERCHANT_ONBOARDING_APPROVE: 'merchant:onboarding:approve',
  MERCHANT_ONBOARDING_REJECT: 'merchant:onboarding:reject',
} as const

export type Permission = (typeof Permissions)[keyof typeof Permissions]

import type { RoleRecord } from '../role.types'

export const fallbackRoles: RoleRecord[] = [
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    status: 'ACTIVE',
    remark: '拥有系统全部权限',
    permissions: ['*:*:*'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: '普通用户',
    code: 'user',
    status: 'ACTIVE',
    remark: '拥有基础访问权限',
    permissions: ['permission:page:view', 'permission:button:view'],
    createdAt: new Date().toISOString(),
  },
]

import type { DeptRecord } from '../dept.types'

export const fallbackDepts: DeptRecord[] = [
  {
    id: 1,
    parentId: null,
    name: '总公司',
    leader: '管理员',
    phone: '13800138000',
    email: 'admin@example.com',
    sort: 1,
    status: 'ACTIVE',
  },
  {
    id: 2,
    parentId: 1,
    name: '研发部门',
    leader: '研发负责人',
    phone: '13800138001',
    email: 'rd@example.com',
    sort: 1,
    status: 'ACTIVE',
  },
  {
    id: 3,
    parentId: 1,
    name: '运营部门',
    leader: '运营负责人',
    phone: '13800138002',
    email: 'ops@example.com',
    sort: 2,
    status: 'ACTIVE',
  },
]

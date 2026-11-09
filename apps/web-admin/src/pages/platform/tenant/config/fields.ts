import type { TenantInfo, TenantListQuery, TenantStatus } from '@/entities/tenant'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'

const tenantStatusMap: Record<TenantStatus, {
  label: string
  type: 'success' | 'warning' | 'danger' | 'info'
}> = {
  PENDING: {
    label: '待审核',
    type: 'warning',
  },
  ACTIVE: {
    label: '正常',
    type: 'success',
  },
  SUSPENDED: {
    label: '已暂停',
    type: 'warning',
  },
  DISABLED: {
    label: '已禁用',
    type: 'danger',
  },
  EXPIRED: {
    label: '已过期',
    type: 'info',
  },
  ARCHIVED: {
    label: '已归档',
    type: 'info',
  },
}

export function getTenantStatusTag(status: TenantStatus) {
  return tenantStatusMap[status] ?? {
    label: status,
    type: 'info' as const,
  }
}

export function createTenantSearchFields(_t: Translate) {
  return [
    {
      prop: 'name',
      label: '租户名称',
      type: 'input',
      placeholder: '请输入租户名称',
    },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部状态',
      options: Object.entries(tenantStatusMap).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
  ] satisfies ConfigFormField[]
}

export function createTenantTableColumns(_t: Translate) {
  return [
    {
      prop: 'id',
      label: 'ID',
      width: 70,
    },
    {
      prop: 'name',
      label: '租户名称',
      minWidth: 140,
    },
    {
      prop: 'code',
      label: '租户编码',
      minWidth: 120,
    },
    {
      label: '状态',
      width: 100,
      tag: row => getTenantStatusTag(row.status),
    },
    {
      prop: 'planCode',
      label: '套餐',
      width: 100,
    },
    {
      prop: 'contactName',
      label: '联系人',
      width: 100,
    },
    {
      prop: 'contactPhone',
      label: '联系电话',
      minWidth: 130,
    },
    {
      label: '店铺数',
      width: 80,
      formatter: row => row._count?.users != null ? String(row._count.users) : '-',
    },
    {
      label: '订单数',
      width: 80,
      formatter: row => row._count?.orders != null ? String(row._count.orders) : '-',
    },
    {
      label: '创建时间',
      minWidth: 180,
      formatter: row => row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-',
    },
  ] satisfies ConfigTableColumn<TenantInfo>[]
}

export function createTenantFormFields(_t: Translate, isEdit: boolean) {
  return [
    {
      prop: 'code',
      label: '租户编码',
      type: 'input',
      placeholder: '请输入租户编码（创建后不可修改）',
      disabled: isEdit,
    },
    {
      prop: 'name',
      label: '租户名称',
      type: 'input',
      placeholder: '请输入租户名称',
    },
    {
      prop: 'contactName',
      label: '联系人',
      type: 'input',
      placeholder: '请输入联系人姓名',
    },
    {
      prop: 'contactPhone',
      label: '联系电话',
      type: 'input',
      placeholder: '请输入联系电话',
    },
    {
      prop: 'contactEmail',
      label: '联系邮箱',
      type: 'input',
      placeholder: '请输入联系邮箱',
    },
    {
      prop: 'planCode',
      label: '套餐',
      type: 'select',
      placeholder: '请选择套餐',
      options: [
        {
          label: '标准版',
          value: 'standard',
        },
        {
          label: '专业版',
          value: 'professional',
        },
        {
          label: '企业版',
          value: 'enterprise',
        },
      ],
    },
    {
      prop: 'remark',
      label: '备注',
      type: 'textarea',
      placeholder: '请输入备注',
    },
  ] satisfies ConfigFormField[]
}

export function createTenantStatusSearchOptions(): TenantListQuery['status'][] {
  return ['', ...Object.keys(tenantStatusMap)] as TenantListQuery['status'][]
}

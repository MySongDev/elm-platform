import type { MerchantApplication, MerchantApplicationStatus } from '@/entities/merchant-onboarding'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { merchantStatusMap } from './workflow'

export function createMerchantSearchFields(_t: Translate) {
  return [
    {
      prop: 'merchantName',
      label: '商家名称',
      type: 'input',
      placeholder: '请输入商家名称',
    },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部状态',
      options: Object.entries(merchantStatusMap).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
  ] satisfies ConfigFormField[]
}

export function createMerchantTableColumns(_t: Translate) {
  return [
    {
      prop: 'merchantName',
      label: '商家名称',
      minWidth: 140,
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
      prop: 'businessCategory',
      label: '经营品类',
      minWidth: 120,
    },
    {
      prop: 'address',
      label: '经营地址',
      minWidth: 160,
    },
    {
      label: '状态',
      width: 120,
      tag: (row) => {
        const config = merchantStatusMap[row.status as MerchantApplicationStatus]
        if (!config) {
          return {
            label: row.status,
            type: 'info' as const,
          }
        }
        return {
          label: config.label,
          type: config.type === '' ? undefined : config.type as 'primary' | 'success' | 'info' | 'warning' | 'danger',
        }
      },
    },
    {
      label: '申请时间',
      minWidth: 180,
      formatter: row => row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-',
    },
  ] satisfies ConfigTableColumn<MerchantApplication>[]
}

export function createMerchantStatusFilterOptions(): Array<{
  label: string
  value: MerchantApplicationStatus | ''
}> {
  return [
    {
      label: '全部',
      value: '',
    },
    ...Object.entries(merchantStatusMap).map(([value, { label }]) => ({
      label,
      value: value as MerchantApplicationStatus,
    })),
  ]
}

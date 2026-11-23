/**
 * @file 用户管理字段配置
 * @domain pages/system/user
 * @description 定义用户搜索字段与表格列，编辑字段由业务弹窗直接渲染。
 */

import type { UserInfo } from '@/entities/user'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusSearchOptions, formatDateTime, getEnabledStatusTag, getStatusText } from '@/shared/lib/admin-display'

export function createUserSearchFields(t: Translate) {
  return [
    {
      prop: 'username',
      label: t('user.username'),
      type: 'input',
      placeholder: t('user.usernamePlaceholder'),
    },
    {
      prop: 'role',
      label: t('user.role'),
      type: 'select',
      placeholder: t('user.role'),
      options: [
        {
          label: t('common.admin'),
          value: 'admin',
        },
        {
          label: t('common.user'),
          value: 'user',
        },
      ],
    },
    {
      prop: 'status',
      label: t('user.status'),
      type: 'select',
      placeholder: t('user.status'),
      options: createEnabledStatusSearchOptions(getStatusText(t)),
    },
  ] satisfies ConfigFormField[]
}

export function createUserTableColumns(t: Translate) {
  return [
    {
      prop: 'id',
      label: 'ID',
      width: 80,
    },
    {
      prop: 'username',
      label: t('user.username'),
      minWidth: 120,
    },
    {
      label: t('user.role'),
      width: 130,
      tag: row => row.role === 'admin'
        ? {
            label: t('common.admin'),
            type: 'danger' as const,
          }
        : {
            label: t('common.user'),
            type: 'info' as const,
          },
    },
    {
      prop: 'email',
      label: t('user.email'),
      minWidth: 180,
    },
    {
      prop: 'phone',
      label: t('user.phone'),
      minWidth: 140,
    },
    {
      label: t('user.status'),
      width: 100,
      tag: row => getEnabledStatusTag(row.status, getStatusText(t)),
    },
    {
      label: t('user.createdAt'),
      minWidth: 180,
      formatter: row => formatDateTime(row.createdAt),
    },
  ] satisfies ConfigTableColumn<UserInfo>[]
}

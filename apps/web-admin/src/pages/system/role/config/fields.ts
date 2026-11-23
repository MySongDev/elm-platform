/**
 * @file 角色管理字段配置
 * @domain features/role-management
 * @description 定义角色查询字段与表格列。
 */

import type { RoleItem } from '../model/types'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusSearchOptions, formatDateTime, getEnabledStatusTag, getStatusText } from '@/shared/lib/admin-display'

export function createRoleSearchFields(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('role.name'),
      type: 'input',
      placeholder: t('role.namePlaceholder'),
    },
    {
      prop: 'code',
      label: t('role.code'),
      type: 'input',
      placeholder: t('role.codePlaceholder'),
    },
    {
      prop: 'status',
      label: t('role.status'),
      type: 'select',
      placeholder: t('common.search'),
      options: createEnabledStatusSearchOptions(getStatusText(t)),
    },
  ] satisfies ConfigFormField[]
}

export function createRoleTableColumns(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('role.name'),
      minWidth: 140,
    },
    {
      prop: 'code',
      label: t('role.code'),
      minWidth: 140,
    },
    {
      label: t('role.status'),
      width: 100,
      tag: row => getEnabledStatusTag(row.status, getStatusText(t)),
    },
    {
      prop: 'remark',
      label: t('role.remark'),
      minWidth: 180,
    },
    {
      label: t('role.createdAt'),
      minWidth: 180,
      formatter: row => formatDateTime(row.createdAt),
    },
  ] satisfies ConfigTableColumn<RoleItem>[]
}

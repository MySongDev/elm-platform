/**
 * @file 部门管理字段配置
 * @domain pages/system/dept
 * @description 定义部门查询表单和树形表格列。
 */

import type { DeptItem } from '../model/types'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusSearchOptions, getEnabledStatusTag, getStatusText } from '@/shared/lib/admin-display'

export function createDeptSearchFields(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('dept.name'),
      type: 'input',
      placeholder: t('dept.namePlaceholder'),
    },
    {
      prop: 'status',
      label: t('dept.status'),
      type: 'select',
      placeholder: t('common.search'),
      options: createEnabledStatusSearchOptions(getStatusText(t)),
    },
  ] satisfies ConfigFormField[]
}

export function createDeptTableColumns(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('dept.name'),
      minWidth: 180,
    },
    {
      prop: 'leader',
      label: t('dept.leader'),
      minWidth: 120,
    },
    {
      prop: 'phone',
      label: t('dept.phone'),
      minWidth: 140,
    },
    {
      prop: 'email',
      label: t('dept.email'),
      minWidth: 180,
    },
    {
      prop: 'sort',
      label: t('dept.sort'),
      width: 80,
    },
    {
      label: t('dept.status'),
      width: 100,
      tag: row => getEnabledStatusTag(row.status, getStatusText(t)),
    },
  ] satisfies ConfigTableColumn<DeptItem>[]
}

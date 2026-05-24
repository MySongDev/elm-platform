/**
 * @file 部门管理字段配置
 * @domain features/dept-management
 * @description 定义部门查询表单、树形表格列和编辑表单字段，父部门选项由业务状态层传入。
 */

import type { DeptItem } from '@/entities/department'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusOptions, createEnabledStatusSearchOptions, getEnabledStatusTag, getStatusText } from '@/shared/lib/admin-display'

export function createDeptSearchFields(t: Translate) {
  return [
    { prop: 'name', label: t('dept.name'), type: 'input', placeholder: t('dept.namePlaceholder') },
    { prop: 'status', label: t('dept.status'), type: 'select', placeholder: t('common.search'), options: createEnabledStatusSearchOptions(getStatusText(t)) },
  ] satisfies ConfigFormField[]
}

export function createDeptTableColumns(t: Translate) {
  return [
    { prop: 'name', label: t('dept.name'), minWidth: 180 },
    { prop: 'leader', label: t('dept.leader'), minWidth: 120 },
    { prop: 'phone', label: t('dept.phone'), minWidth: 140 },
    { prop: 'email', label: t('dept.email'), minWidth: 180 },
    { prop: 'sort', label: t('dept.sort'), width: 80 },
    { label: t('dept.status'), width: 100, tag: row => getEnabledStatusTag(row.status, getStatusText(t)) },
  ] satisfies ConfigTableColumn<DeptItem>[]
}

export function createDeptFormFields(t: Translate, parentOptions: DeptItem[]) {
  return [
    {
      prop: 'parentId',
      label: t('dept.parentDept'),
      type: 'select',
      placeholder: t('dept.parentDeptPlaceholder'),
      options: parentOptions.map(item => ({ label: item.name, value: item.id })),
    },
    { prop: 'name', label: t('dept.name'), type: 'input', placeholder: t('dept.namePlaceholder') },
    { prop: 'leader', label: t('dept.leader'), type: 'input', placeholder: t('dept.leaderPlaceholder') },
    { prop: 'phone', label: t('dept.phone'), type: 'input', placeholder: t('dept.phonePlaceholder') },
    { prop: 'email', label: t('dept.email'), type: 'input', placeholder: t('dept.emailPlaceholder') },
    { prop: 'sort', label: t('dept.sort'), type: 'inputNumber', min: 0 },
    { prop: 'status', label: t('dept.status'), type: 'radio', options: createEnabledStatusOptions(getStatusText(t)) },
  ] satisfies ConfigFormField[]
}

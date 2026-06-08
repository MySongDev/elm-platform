/**
 * @file 角色管理字段配置
 * @domain features/role-management
 * @description 定义角色查询表单、表格列和编辑表单字段，并把按钮权限转换为可选择项。
 */

import type { ButtonPermission } from '@/entities/permission'
import type { RoleItem } from '@/entities/role'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusOptions, createEnabledStatusSearchOptions, formatDateTime, getEnabledStatusTag, getStatusText } from '@/shared/lib/admin-display'

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

export function createRoleFormFields(t: Translate, permissionOptions: ButtonPermission[]) {
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
      prop: 'permissions',
      label: t('role.permissions'),
      type: 'select',
      placeholder: t('role.permissionsPlaceholder'),
      multiple: true,
      filterable: true,
      collapseTags: true,
      collapseTagsTooltip: true,
      options: permissionOptions.map(item => ({
        label: `${item.name}（${item.code}）`,
        value: item.code,
      })),
    },
    {
      prop: 'status',
      label: t('role.status'),
      type: 'radio',
      options: createEnabledStatusOptions(getStatusText(t)),
    },
    {
      prop: 'remark',
      label: t('role.remark'),
      type: 'textarea',
      placeholder: t('role.remarkPlaceholder'),
      rows: 3,
    },
  ] satisfies ConfigFormField[]
}

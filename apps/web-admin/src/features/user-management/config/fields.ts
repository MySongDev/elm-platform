/**
 * @file 用户管理字段配置
 * @domain features/user-management
 * @description 定义用户查询表单、表格列和编辑表单字段，供配置化 CRUD 组件渲染。
 */

import type { UserInfo } from '@/entities/user'
import type { ConfigFieldOption, ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusOptions, createEnabledStatusSearchOptions, formatDateTime, getEnabledStatusTag, getStatusText } from '@/shared/config-crud'

export function createUserSearchFields(t: Translate) {
  return [
    { prop: 'username', label: t('user.username'), type: 'input', placeholder: t('user.usernamePlaceholder') },
    {
      prop: 'role',
      label: t('user.role'),
      type: 'select',
      placeholder: t('user.role'),
      options: [
        { label: t('common.admin'), value: 'admin' },
        { label: t('common.user'), value: 'user' },
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
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'username', label: t('user.username'), minWidth: 120 },
    {
      label: t('user.role'),
      width: 130,
      tag: row => row.role === 'admin'
        ? { label: t('common.admin'), type: 'danger' as const }
        : { label: t('common.user'), type: 'info' as const },
    },
    { prop: 'email', label: t('user.email'), minWidth: 180 },
    { prop: 'phone', label: t('user.phone'), minWidth: 140 },
    { label: t('user.status'), width: 100, tag: row => getEnabledStatusTag(row.status, getStatusText(t)) },
    { label: t('user.createdAt'), minWidth: 180, formatter: row => formatDateTime(row.createdAt) },
  ] satisfies ConfigTableColumn<UserInfo>[]
}

export function createUserFormFields(t: Translate, permissionOptions: ConfigFieldOption[], isEdit: boolean) {
  return [
    { prop: 'username', label: t('user.username'), type: 'input', placeholder: t('user.usernamePlaceholder') },
    ...(!isEdit
      ? [{ prop: 'password', label: t('login.password'), type: 'password' as const, placeholder: t('user.passwordPlaceholder'), showPassword: true }]
      : []),
    {
      prop: 'role',
      label: t('user.role'),
      type: 'radio',
      options: [
        { label: t('common.admin'), value: 'admin' },
        { label: t('common.user'), value: 'user' },
      ],
    },
    { prop: 'status', label: t('user.status'), type: 'radio', options: createEnabledStatusOptions(getStatusText(t)) },
    { prop: 'email', label: t('user.email'), type: 'input', placeholder: t('user.emailPlaceholder') },
    { prop: 'phone', label: t('user.phone'), type: 'input', placeholder: t('user.phonePlaceholder') },
    {
      prop: 'permissions',
      label: t('user.permissions'),
      type: 'select',
      placeholder: t('user.permissionsPlaceholder'),
      multiple: true,
      filterable: true,
      collapseTags: true,
      collapseTagsTooltip: true,
      options: permissionOptions,
    },
  ] satisfies ConfigFormField[]
}

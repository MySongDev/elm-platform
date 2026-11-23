/**
 * @file 菜单管理字段配置
 * @domain features/menu-management
 * @description 定义菜单查询字段、树形表格列和编辑校验规则。
 */

import type { FormRules } from 'element-plus'
import type { MenuItem } from '@/entities/system-menu'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusSearchOptions, getEnabledStatusTag, getStatusText } from '@/shared/lib/admin-display'

export function createMenuSearchFields(t: Translate) {
  return [
    {
      prop: 'title',
      label: t('menu.title'),
      type: 'input',
      placeholder: t('menu.titlePlaceholder'),
    },
    {
      prop: 'status',
      label: t('menu.status'),
      type: 'select',
      placeholder: t('common.search'),
      options: createEnabledStatusSearchOptions(getStatusText(t)),
    },
  ] satisfies ConfigFormField[]
}

export function createMenuTableColumns(t: Translate) {
  return [
    {
      prop: 'title',
      label: t('menu.title'),
      minWidth: 180,
    },
    {
      prop: 'path',
      label: t('menu.path'),
      minWidth: 180,
    },
    {
      prop: 'name',
      label: t('menu.routeName'),
      minWidth: 140,
    },
    {
      prop: 'icon',
      label: t('menu.icon'),
      width: 100,
    },
    {
      prop: 'permission',
      label: t('menu.permission'),
      minWidth: 180,
    },
    {
      prop: 'sort',
      label: t('menu.sort'),
      width: 80,
    },
    {
      label: t('menu.status'),
      width: 100,
      tag: row => getEnabledStatusTag(row.status, getStatusText(t)),
    },
  ] satisfies ConfigTableColumn<MenuItem>[]
}

export function createMenuFormRules(t: Translate): FormRules {
  return {
    title: [
      {
        required: true,
        message: t('menu.titleRequired'),
        trigger: 'blur',
      },
    ],
    path: [
      {
        required: true,
        message: t('menu.pathRequired'),
        trigger: 'blur',
      },
    ],
  }
}

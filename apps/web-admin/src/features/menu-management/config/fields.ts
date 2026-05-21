/**
 * @file 菜单管理字段配置
 * @domain features/menu-management
 * @description 定义菜单查询表单、树形表格列和编辑表单字段，父菜单选项由业务状态层传入。
 */

import type { MenuItem } from '@/entities/system-menu'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { createEnabledStatusOptions, createEnabledStatusSearchOptions, getEnabledStatusTag, getStatusText } from '@/shared/config-crud'

export function createMenuSearchFields(t: Translate) {
  return [
    { prop: 'title', label: t('menu.title'), type: 'input', placeholder: t('menu.titlePlaceholder') },
    { prop: 'status', label: t('menu.status'), type: 'select', placeholder: t('common.search'), options: createEnabledStatusSearchOptions(getStatusText(t)) },
  ] satisfies ConfigFormField[]
}

export function createMenuTableColumns(t: Translate) {
  return [
    { prop: 'title', label: t('menu.title'), minWidth: 180 },
    { prop: 'path', label: t('menu.path'), minWidth: 180 },
    { prop: 'name', label: t('menu.routeName'), minWidth: 140 },
    { prop: 'icon', label: t('menu.icon'), width: 100 },
    { prop: 'permission', label: t('menu.permission'), minWidth: 180 },
    { prop: 'sort', label: t('menu.sort'), width: 80 },
    { label: t('menu.status'), width: 100, tag: row => getEnabledStatusTag(row.status, getStatusText(t)) },
  ] satisfies ConfigTableColumn<MenuItem>[]
}

export function createMenuFormFields(t: Translate, parentOptions: MenuItem[]) {
  return [
    {
      prop: 'parentId',
      label: t('menu.parentMenu'),
      type: 'select',
      placeholder: t('menu.parentMenuPlaceholder'),
      options: parentOptions.map(item => ({ label: item.title, value: item.id })),
    },
    { prop: 'title', label: t('menu.title'), type: 'input', placeholder: t('menu.titlePlaceholder') },
    { prop: 'path', label: t('menu.path'), type: 'input', placeholder: t('menu.pathPlaceholder') },
    { prop: 'name', label: t('menu.routeName'), type: 'input', placeholder: t('menu.routeNamePlaceholder') },
    { prop: 'icon', label: t('menu.icon'), type: 'input', placeholder: t('menu.iconPlaceholder') },
    { prop: 'permission', label: t('menu.permission'), type: 'input', placeholder: t('menu.permissionPlaceholder') },
    {
      prop: 'type',
      label: t('menu.type'),
      type: 'radio',
      options: [
        { label: t('menu.catalog'), value: 'catalog' },
        { label: t('menu.menuType'), value: 'menu' },
        { label: t('menu.button'), value: 'button' },
      ],
    },
    { prop: 'sort', label: t('menu.sort'), type: 'inputNumber', min: 0 },
    { prop: 'status', label: t('menu.status'), type: 'radio', options: createEnabledStatusOptions(getStatusText(t)) },
  ] satisfies ConfigFormField[]
}

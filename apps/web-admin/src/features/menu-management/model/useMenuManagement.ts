/**
 * @file 菜单管理组合式状态
 * @domain features/menu-management
 * @description 聚合系统菜单树 CRUD、父菜单选项和表单校验，是菜单管理页面的业务状态边界。
 */

import type { MenuItem } from '@/entities/system-menu'
import { createMenu, deleteMenu, getMenus, updateMenu } from '@/entities/system-menu'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'
import { filterTree, flattenTree } from '@/shared/lib/tree'
import { createMenuFormRules } from '../config/fields'

interface MenuQuery {
  title: string
  status: string
}

export interface MenuFormState {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string
  icon: string
  permission: string
  type: MenuItem['type']
  sort: number
  status: number
}

const defaultForm: MenuFormState = {
  id: 0,
  parentId: null,
  title: '',
  path: '',
  name: '',
  icon: '',
  permission: '',
  type: 'menu',
  sort: 0,
  status: 1,
}

/**
 * @description 有副作用：调用系统菜单接口，维护树形表格/表单状态，并通过 CRUD feedback 触发确认与提示。
 * @returns 菜单管理页面使用的 CRUD 状态、父菜单选项、校验规则和操作函数。
 */
export function useMenuManagement() {
  const { t } = useI18n()

  const crud = useConfigCrud<MenuItem, MenuQuery, MenuFormState, Partial<MenuItem>>({
    getDefaultQuery: () => ({
      title: '',
      status: '',
    }),
    getDefaultForm: () => ({ ...defaultForm }),
    fetchList: getMenus,
    createItem: createMenu,
    updateItem: updateMenu,
    deleteItem: deleteMenu,
    getFormId: form => form.id,
    getRowId: row => row.id,
    filterList: (items, query) => filterTree(items, (item) => {
      const titleMatched = !query.title || item.title.includes(query.title)
      const statusMatched = query.status === '' || String(item.status) === query.status
      return titleMatched && statusMatched
    }),
    toForm: row => ({
      id: row.id,
      parentId: row.parentId,
      title: row.title,
      path: row.path,
      name: row.name || '',
      icon: row.icon || '',
      permission: row.permission || '',
      type: row.type,
      sort: row.sort,
      status: row.status,
    }),
    deleteConfirm: row => t('menu.deleteConfirm', { name: row.title }),
    saveSuccessMessage: t('crud.saveSuccess'),
    deleteSuccessMessage: t('crud.deleteSuccess'),
    feedback: createElementPlusCrudFeedback(),
  })

  const rules = computed(() => createMenuFormRules(t))

  const parentOptions = computed(() => flattenTree(crud.tableData.value).filter(item => item.id !== crud.form.id))

  function openCreateDialog(parent?: MenuItem) {
    crud.resetForm()
    if (parent)
      crud.form.parentId = parent.id
    crud.dialogVisible.value = true
  }

  return {
    loading: crud.loading,
    saving: crud.saving,
    dialogVisible: crud.dialogVisible,
    tableData: crud.tableData,
    query: crud.query,
    form: crud.form,
    isEdit: crud.isEdit,
    filteredData: crud.filteredData,
    pagination: crud.pagination,
    resetQuery: crud.resetQuery,
    resetForm: crud.resetForm,
    openCreateDialog,
    openEditDialog: crud.openEditDialog,
    fetchMenus: crud.fetchRows,
    submitForm: crud.submitForm,
    handleDelete: crud.handleDelete,
    handlePageChange: crud.handlePageChange,
    handleSizeChange: crud.handleSizeChange,
    rules,
    parentOptions,
  }
}

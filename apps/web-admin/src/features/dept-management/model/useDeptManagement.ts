/**
 * @file 部门管理组合式状态
 * @domain features/dept-management
 * @description 聚合部门树 CRUD、父级选项和表单校验，是部门管理页面的业务状态边界。
 */

import type { FormRules } from 'element-plus'
import type { DeptItem } from '@/entities/department'
import { createDept, deleteDept, getDepts, updateDept } from '@/entities/department'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'
import { filterTree, flattenTree } from '@/shared/lib/tree'

interface DeptQuery {
  name: string
  status: string
}

export interface DeptFormState {
  id: number
  parentId: number | null
  name: string
  leader: string
  phone: string
  email: string
  sort: number
  status: number
}

const defaultForm: DeptFormState = {
  id: 0,
  parentId: null,
  name: '',
  leader: '',
  phone: '',
  email: '',
  sort: 0,
  status: 1,
}

/**
 * @description 有副作用：调用部门接口，维护树形表格/表单状态，并通过 CRUD feedback 触发确认与提示。
 * @returns 部门管理页面使用的 CRUD 状态、父级选项、校验规则和操作函数。
 */
export function useDeptManagement() {
  const { t } = useI18n()

  const crud = useConfigCrud<DeptItem, DeptQuery, DeptFormState, Partial<DeptItem>>({
    getDefaultQuery: () => ({
      name: '',
      status: '',
    }),
    getDefaultForm: () => ({ ...defaultForm }),
    fetchList: getDepts,
    createItem: createDept,
    updateItem: updateDept,
    deleteItem: deleteDept,
    getFormId: form => form.id,
    getRowId: row => row.id,
    filterList: (items, query) => filterTree(items, (item) => {
      const nameMatched = !query.name || item.name.includes(query.name)
      const statusMatched = query.status === '' || String(item.status) === query.status
      return nameMatched && statusMatched
    }),
    toForm: row => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      leader: row.leader || '',
      phone: row.phone || '',
      email: row.email || '',
      sort: row.sort,
      status: row.status,
    }),
    deleteConfirm: row => t('dept.deleteConfirm', { name: row.name }),
    saveSuccessMessage: t('crud.saveSuccess'),
    deleteSuccessMessage: t('crud.deleteSuccess'),
    feedback: createElementPlusCrudFeedback(),
  })

  const rules: FormRules = {
    name: [{
      required: true,
      message: t('dept.nameRequired'),
      trigger: 'blur',
    }],
  }

  const parentOptions = computed(() => flattenTree(crud.tableData.value).filter(item => item.id !== crud.form.id))

  function openCreateDialog(parent?: DeptItem) {
    crud.resetForm()
    if (parent)
      crud.form.parentId = parent.id
    crud.dialogVisible.value = true
  }

  return {
    ...crud,
    rules,
    parentOptions,
    openCreateDialog,
    fetchDepts: crud.fetchRows,
  }
}

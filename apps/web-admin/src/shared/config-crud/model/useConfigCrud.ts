/**
 * @file 配置化 CRUD 组合式函数
 * @domain shared/config-crud
 * @description 封装列表查询、表单弹窗、分页、保存、删除和反馈流程，降低后台 CRUD 页面重复逻辑。
 */

import type { CrudId, UseConfigCrudOptions } from './useConfigCrud.types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'

/**
 * @description 有副作用：调用传入的 CRUD 请求、更新响应式状态，并通过 feedback 触发确认框或消息提示。
 * @param options 当前业务 CRUD 页面提供的数据源、转换规则和反馈实现。
 * @returns 可绑定到列表、表单和分页组件的 CRUD 状态与操作函数。
 */
export function useConfigCrud<
  Row,
  Query extends object = Record<string, unknown>,
  Form extends object = Partial<Row>,
  Id extends CrudId = number,
>(options: UseConfigCrudOptions<Row, Query, Form, Id>) {
  const loading = shallowRef(false)
  const saving = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const dialogVisible = shallowRef(false)
  const tableData = shallowRef<Row[]>([])
  const query = reactive(options.getDefaultQuery()) as Query
  const form = reactive(options.getDefaultForm()) as Form

  let fetchAbortController: AbortController | null = null

  const isEdit = computed(() => Boolean(options.getFormId(form)))
  const filteredData = computed(() => {
    if (options.filterList)
      return options.filterList(tableData.value, query)
    if (options.filterItem)
      return tableData.value.filter(row => options.filterItem?.(row, query))
    return tableData.value
  })

  function resetQuery() {
    Object.assign(query, structuredClone(options.getDefaultQuery()))
  }

  function resetForm() {
    Object.assign(form, structuredClone(options.getDefaultForm()))
  }

  function openCreateDialog(seed?: Partial<Form>) {
    resetForm()
    if (seed)
      Object.assign(form, seed)
    dialogVisible.value = true
  }

  function openEditDialog(row: Row) {
    resetForm()
    Object.assign(form, options.toForm ? options.toForm(row) : row)
    dialogVisible.value = true
  }

  async function fetchRows() {
    fetchAbortController?.abort()
    const controller = new AbortController()
    fetchAbortController = controller

    loading.value = true
    error.value = null

    try {
      const result = await options.fetchList()

      if (controller.signal.aborted)
        return

      tableData.value = result as Row[]
    }
    catch (caughtError) {
      if (!controller.signal.aborted)
        error.value = caughtError
      throw caughtError
    }
    finally {
      if (!controller.signal.aborted)
        loading.value = false
    }
  }

  function resolveSaveSuccessMessage(id: ReturnType<typeof options.getFormId>) {
    const message = options.saveSuccessMessage ?? '保存成功'
    if (typeof message === 'function') {
      return message({
        form,
        id,
        isEdit: Boolean(id),
      })
    }
    return message
  }

  async function submitForm() {
    saving.value = true

    try {
      const payload = options.toPayload ? options.toPayload(form) : form
      const id = options.getFormId(form)

      if (id)
        await options.updateItem(id as Id, payload)
      else
        await options.createItem(payload)

      ElMessage.success(resolveSaveSuccessMessage(id))
      dialogVisible.value = false
      await fetchRows()
    }
    finally {
      saving.value = false
    }
  }

  async function handleDelete(row: Row) {
    try {
      await ElMessageBox.confirm(options.deleteConfirm(row), '提示', { type: 'warning' })
    }
    catch {
      return
    }

    await options.deleteItem(options.getRowId(row))
    ElMessage.success(options.deleteSuccessMessage ?? '删除成功')
    await fetchRows()
  }

  onScopeDispose(() => {
    fetchAbortController?.abort()
  })

  return {
    loading,
    saving,
    error,
    dialogVisible,
    tableData,
    query,
    form,
    isEdit,
    filteredData,
    resetQuery,
    resetForm,
    openCreateDialog,
    openEditDialog,
    fetchRows,
    submitForm,
    handleDelete,
  }
}

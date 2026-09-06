import { ElMessage, ElMessageBox } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useConfigCrud } from '../useConfigCrud'

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve()),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

interface Row {
  id: number
  name: string
}

interface Query {
  name: string
}

interface FormState {
  id: number
  name: string
}

function createCrudOptions(overrides: Partial<Parameters<typeof useConfigCrud<Row, Query, FormState>>[0]> = {}) {
  return {
    getDefaultQuery: () => ({ name: '' }),
    getDefaultForm: () => ({
      id: 0,
      name: '',
    }),
    fetchList: vi.fn<() => Promise<Row[]>>().mockResolvedValue([]),
    createItem: vi.fn<(payload: Partial<FormState>) => Promise<void>>().mockResolvedValue(undefined),
    updateItem: vi.fn<(id: number, payload: Partial<FormState>) => Promise<void>>().mockResolvedValue(undefined),
    deleteItem: vi.fn<(id: number) => Promise<void>>().mockResolvedValue(undefined),
    getFormId: (form: FormState) => form.id,
    getRowId: (row: Row) => row.id,
    deleteConfirm: (row: Row) => `删除 ${row.name}?`,
    ...overrides,
  }
}

function runInScope<T>(factory: () => T) {
  const scope = effectScope()
  const result = scope.run(factory)
  if (!result)
    throw new Error('effect scope did not return a result')
  return {
    result,
    dispose: () => scope.stop(),
  }
}

describe('useConfigCrud', () => {
  it('shows an Element Plus success message after saving', async () => {
    const options = createCrudOptions({
      saveSuccessMessage: '保存好了',
    })

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      crud.form.name = 'Alice'

      await crud.submitForm()

      expect(options.createItem).toHaveBeenCalledWith(crud.form)
      expect(ElMessage.success).toHaveBeenCalledWith('保存好了')
    }
    finally {
      dispose()
    }
  })

  it('resolves save success messages from the current save mode', async () => {
    const options = createCrudOptions({
      saveSuccessMessage: ({ isEdit }) => isEdit ? '更新好了' : '创建好了',
    })

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      crud.form.name = 'Alice'
      await crud.submitForm()

      expect(options.createItem).toHaveBeenCalledWith(crud.form)
      expect(ElMessage.success).toHaveBeenLastCalledWith('创建好了')

      crud.openEditDialog({
        id: 1,
        name: 'Alice',
      })
      await crud.submitForm()

      expect(options.updateItem).toHaveBeenCalledWith(1, crud.form)
      expect(ElMessage.success).toHaveBeenLastCalledWith('更新好了')
    }
    finally {
      dispose()
    }
  })

  it('skips the delete action when the confirmation is canceled', async () => {
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('canceled'))
    const options = createCrudOptions()

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      await crud.handleDelete({
        id: 1,
        name: 'Alice',
      })
      await nextTick()

      expect(ElMessageBox.confirm).toHaveBeenCalledWith('删除 Alice?', '提示', { type: 'warning' })
      expect(options.deleteItem).not.toHaveBeenCalled()
      expect(ElMessage.success).not.toHaveBeenCalled()
    }
    finally {
      dispose()
    }
  })

  it('records fetch errors and clears them before the next fetch', async () => {
    const fetchError = new Error('fetch failed')
    const options = createCrudOptions({
      fetchList: vi.fn()
        .mockRejectedValueOnce(fetchError)
        .mockResolvedValueOnce([{
          id: 1,
          name: 'Alice',
        }]),
    })

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      await expect(crud.fetchRows()).rejects.toBe(fetchError)

      expect(crud.error.value).toBe(fetchError)
      expect(crud.loading.value).toBe(false)

      await crud.fetchRows()

      expect(crud.error.value).toBeNull()
      expect(crud.tableData.value).toEqual([{
        id: 1,
        name: 'Alice',
      }])
    }
    finally {
      dispose()
    }
  })

  it('fetchRows always calls fetchList without pagination parameters', async () => {
    const options = createCrudOptions({
      fetchList: vi.fn()
        .mockResolvedValue([{
          id: 1,
          name: 'Alice',
        }]),
    })

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      await crud.fetchRows()

      expect(options.fetchList).toHaveBeenCalledTimes(1)
      expect(options.fetchList).toHaveBeenCalledWith()
    }
    finally {
      dispose()
    }
  })

  it('openCreateDialog applies the seed on top of a reset form without losing edit state', async () => {
    const options = createCrudOptions()

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      crud.openEditDialog({
        id: 1,
        name: 'Alice',
      })
      expect(crud.isEdit.value).toBe(true)

      crud.openCreateDialog({ name: 'Bob' })

      expect(crud.dialogVisible.value).toBe(true)
      expect(crud.isEdit.value).toBe(false)
      expect(crud.form.name).toBe('Bob')
      expect(crud.form.id).toBe(0)
    }
    finally {
      dispose()
    }
  })

  it('openCreateDialog without a seed resets the form to defaults', async () => {
    const options = createCrudOptions()

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      crud.openEditDialog({
        id: 1,
        name: 'Alice',
      })
      crud.openCreateDialog()

      expect(crud.dialogVisible.value).toBe(true)
      expect(crud.isEdit.value).toBe(false)
      expect(crud.form.name).toBe('')
    }
    finally {
      dispose()
    }
  })
})

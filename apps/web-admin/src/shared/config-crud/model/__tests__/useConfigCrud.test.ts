import { describe, expect, it, vi } from 'vitest'
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
    getDefaultForm: () => ({ id: 0, name: '' }),
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

describe('useConfigCrud feedback adapter', () => {
  it('uses injected feedback for save success instead of importing UI side effects', async () => {
    const notifySaveSuccess = vi.fn()
    const options = createCrudOptions({
      saveSuccessMessage: '保存好了',
      feedback: {
        notifySaveSuccess,
      },
    })

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      crud.form.name = 'Alice'

      await crud.submitForm()

      expect(options.createItem).toHaveBeenCalledWith(crud.form)
      expect(notifySaveSuccess).toHaveBeenCalledWith('保存好了')
    }
    finally {
      dispose()
    }
  })

  it('lets injected feedback cancel delete before the delete action runs', async () => {
    const confirmDelete = vi.fn().mockResolvedValue(false)
    const notifyDeleteSuccess = vi.fn()
    const options = createCrudOptions({
      feedback: {
        confirmDelete,
        notifyDeleteSuccess,
      },
    })

    const { result: crud, dispose } = runInScope(() => useConfigCrud<Row, Query, FormState>(options))

    try {
      await crud.handleDelete({ id: 1, name: 'Alice' })
      await nextTick()

      expect(confirmDelete).toHaveBeenCalledWith('删除 Alice?')
      expect(options.deleteItem).not.toHaveBeenCalled()
      expect(notifyDeleteSuccess).not.toHaveBeenCalled()
    }
    finally {
      dispose()
    }
  })
})

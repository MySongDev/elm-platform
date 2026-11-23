/**
 * @file 租户保存反馈回归
 * @domain pages/platform/tenant
 * @description 将公共 CRUD 的保存成功与创建/更新文案场景迁到租户编辑器契约。
 */

import type { TenantFormState } from '../../model/form'
import type { TenantInfo } from '@/entities/tenant'
import { ElMessage } from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, h, reactive } from 'vue'
import TenantFormDialog from '../TenantFormDialog.vue'

interface Bindings {
  model: TenantFormState
  saving: boolean
  onSubmit: () => Promise<void>
}
const api = vi.hoisted(() => ({
  createTenant: vi.fn(),
  updateTenant: vi.fn(),
}))
const dialog = vi.hoisted(() => ({ bindings: null as Bindings | null }))
vi.mock('@/entities/tenant', () => api)
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn() } }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/shared/config-crud', async () => {
  const { defineComponent } = await import('vue')
  return {
    ConfigFormDialog: defineComponent({
      props: ['model', 'visible', 'saving', 'title', 'rules', 'onSubmit'],
      setup(props) {
        dialog.bindings = props as unknown as Bindings
        return () => null
      },
    }),
  }
})

// 复用用户编辑器的内存渲染方式，只替换公共表单边界，不引入 DOM 依赖。
const { createApp } = createRenderer({
  patchProp() {},
  insert() {},
  remove() {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null,
})
const disposers: (() => void)[] = []
function mountEditor(tenant: TenantInfo | null = null) {
  const state = reactive({
    tenant,
    visible: true,
  })
  const saved = vi.fn()
  const app = createApp({
    render: () => h(TenantFormDialog, {
      'tenant': state.tenant,
      'visible': state.visible,
      'onUpdate:visible': (value: boolean) => { state.visible = value },
      'onSaved': saved,
    }),
  })
  for (const name of ['el-alert', 'el-form-item', 'el-input'])
    app.component(name, { render: () => null })
  app.mount({})
  disposers.push(() => app.unmount())
  return {
    state,
    saved,
    bindings: dialog.bindings!,
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  api.createTenant.mockResolvedValue(undefined)
  api.updateTenant.mockResolvedValue(undefined)
})
afterEach(() => {
  for (const dispose of disposers.splice(0))
    dispose()
})

describe('tenant editor save feedback', () => {
  it('shows success and closes the editor after saving', async () => {
    const { bindings, saved, state } = mountEditor()
    Object.assign(bindings.model, {
      code: 'tenant-a',
      name: 'Tenant A',
    })
    await bindings.onSubmit()
    expect(api.createTenant).toHaveBeenCalledWith({
      code: 'tenant-a',
      name: 'Tenant A',
      contactName: undefined,
      contactPhone: undefined,
      contactEmail: undefined,
      planCode: 'standard',
      remark: undefined,
    })
    expect(ElMessage.success).toHaveBeenCalledWith('创建租户成功')
    expect(saved).toHaveBeenCalledOnce()
    expect(state.visible).toBe(false)
  })

  it('uses the matching create and update success messages', async () => {
    const created = mountEditor()
    Object.assign(created.bindings.model, {
      code: 'tenant-a',
      name: 'Tenant A',
    })
    await created.bindings.onSubmit()
    expect(ElMessage.success).toHaveBeenLastCalledWith('创建租户成功')
    const updated = mountEditor({
      id: 7,
      code: 'tenant-a',
      name: 'Tenant A',
      status: 'ACTIVE',
      planCode: 'standard',
      contactName: null,
      contactPhone: null,
      contactEmail: null,
      remark: null,
      createdAt: '',
      updatedAt: '',
      availableActions: [],
    })
    updated.bindings.model.code = 'ignored-update-code'
    updated.bindings.model.name = 'Updated'
    await updated.bindings.onSubmit()
    expect(api.updateTenant).toHaveBeenCalledWith(7, {
      name: 'Updated',
      contactName: undefined,
      contactPhone: undefined,
      contactEmail: undefined,
      planCode: 'standard',
      remark: undefined,
    })
    expect(ElMessage.success).toHaveBeenLastCalledWith('更新租户成功')
    expect(updated.saved).toHaveBeenCalledOnce()
  })
})

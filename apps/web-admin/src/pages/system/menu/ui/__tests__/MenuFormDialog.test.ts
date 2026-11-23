/**
 * @file 菜单新增初始化回归
 * @domain pages/system/menu
 * @description 将公共 CRUD 的带父级新增和编辑转新增重置场景迁到菜单编辑器。
 */

import type { MenuFormState } from '../../model/form'
import type { MenuItem } from '@/entities/system-menu'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, h, nextTick, reactive } from 'vue'
import MenuFormDialog from '../MenuFormDialog.vue'

interface Bindings {
  model: MenuFormState
  onSubmit: () => Promise<void>
}
const api = vi.hoisted(() => ({
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
}))
const dialog = vi.hoisted(() => ({ bindings: null as Bindings | null }))
vi.mock('@/entities/system-menu', () => api)
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
  },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))
vi.mock('@/shared/config-crud', async () => {
  const { defineComponent } = await import('vue')
  return {
    ConfigFormDialog: defineComponent({
      props: [
        'model',
        'visible',
        'saving',
        'title',
        'rules',
        'onSubmit',
      ],
      setup(props) {
        dialog.bindings = props as unknown as Bindings
        return () => null
      },
    }),
  }
})

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
const menu: MenuItem = {
  id: 7,
  parentId: 1,
  title: 'Old',
  path: '/old',
  name: 'Old',
  icon: 'old',
  permission: 'old:view',
  type: 'catalog',
  sort: 8,
  status: 'DISABLED',
}
function mountEditor() {
  const state = reactive({
    menu: menu as MenuItem | null,
    visible: true,
    initialParentId: null as number | null,
  })
  const app = createApp({
    render: () => h(MenuFormDialog, {
      'menu': state.menu,
      'menus': [],
      'visible': state.visible,
      'initialParentId': state.initialParentId,
      'onUpdate:visible': (value: boolean) => { state.visible = value },
    }),
  })
  for (const name of [
    'el-alert',
    'el-form-item',
    'el-input',
    'el-input-number',
    'el-select',
    'el-option',
    'el-radio-group',
    'el-radio',
  ]) {
    app.component(name, {
      render: () => null,
    })
  }
  app.mount({})
  disposers.push(() => app.unmount())
  return {
    state,
    bindings: dialog.bindings!,
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  api.createMenu.mockResolvedValue(undefined)
  api.updateMenu.mockResolvedValue(undefined)
})
afterEach(() => {
  for (const dispose of disposers.splice(0))
    dispose()
})

describe('menu editor create initialization', () => {
  it('applies an initial parent to a fresh draft after editing', async () => {
    const { state, bindings } = mountEditor()
    state.visible = false
    await nextTick()
    state.menu = null
    state.initialParentId = 9
    state.visible = true
    await nextTick()
    expect(bindings.model.parentId).toBe(9)
    expect(bindings.model.title).toBe('')
    Object.assign(bindings.model, {
      title: 'Child',
      path: '/child',
    })
    await bindings.onSubmit()
    expect(api.createMenu).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Child',
      parentId: 9,
    }))
    expect(api.updateMenu).not.toHaveBeenCalled()
  })

  it('resets all defaults when opening a top-level create after editing', async () => {
    const { state, bindings } = mountEditor()
    state.visible = false
    await nextTick()
    state.menu = null
    state.visible = true
    await nextTick()
    expect(bindings.model).toEqual({
      parentId: null,
      title: '',
      path: '',
      name: '',
      icon: '',
      permission: '',
      type: 'menu',
      sort: 0,
      status: 'ACTIVE',
    })
  })
})

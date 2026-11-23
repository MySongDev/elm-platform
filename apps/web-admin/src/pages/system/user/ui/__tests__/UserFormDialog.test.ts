/**
 * @file 用户编辑器载荷回归
 * @domain pages/system/user
 * @description 将原有七个转换和保存回归迁移到纯函数与编辑器的公共表单契约。
 */

import type { UserFormState } from '../../model/form'
import type { UserInfo } from '@/entities/user'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRenderer, h, nextTick, reactive } from 'vue'
import { createUserForm, toCreateUserParams, toUpdateUserParams } from '../../model/form'
import UserFormDialog from '../UserFormDialog.vue'

interface DialogBindings {
  model: UserFormState
  saving: boolean
  submitDisabled: boolean
  onSubmit: () => Promise<void>
}

const userApi = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}))
const dialog = vi.hoisted(() => ({ bindings: null as DialogBindings | null }))

vi.mock('@/entities/user', () => userApi)
vi.mock('@/entities/permission', () => ({
  getButtonPermissions: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/entities/tenant', () => ({
  getTenantList: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/shared/api/request', () => ({
  default: {
    get: vi.fn().mockResolvedValue([]),
  },
}))
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
        'submitDisabled',
        'title',
        'rules',
        'onSubmit',
      ],
      setup(props) {
        dialog.bindings = props as unknown as DialogBindings
        return () => null
      },
    }),
  }
})

// 当前 Vitest 使用 node；只挂载业务编辑器，公共弹窗提供 model/submit 契约，无需 DOM 或新增依赖。
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

function createForm(overrides: Partial<UserFormState> = {}): UserFormState {
  return {
    ...createUserForm(),
    username: 'alice',
    password: '123456',
    ...overrides,
  }
}

function createUserRow(): UserInfo {
  return {
    id: 7,
    username: 'alice',
    email: 'old@example.com',
    phone: '13800138000',
    avatar: null,
    role: 'admin',
    status: 'ACTIVE',
    permissions: ['user:view'],
  }
}

async function mountEditor(user: UserInfo | null = null) {
  const state = reactive({
    user,
    visible: true,
  })
  const saved = vi.fn()
  const app = createApp({
    render: () => h(UserFormDialog, {
      'user': state.user,
      'visible': state.visible,
      'onUpdate:visible': (visible: boolean) => { state.visible = visible },
      'onSaved': saved,
    }),
  })
  for (const name of [
    'el-alert',
    'el-button',
    'el-form-item',
    'el-input',
    'el-radio-group',
    'el-radio',
    'el-select',
    'el-option',
  ]) {
    app.component(name, {
      render: () => null,
    })
  }
  app.mount({})
  disposers.push(() => app.unmount())
  await vi.waitFor(() => expect(dialog.bindings?.submitDisabled).toBe(false))
  const bindings = dialog.bindings
  if (!bindings)
    throw new Error('form dialog did not receive its bindings')
  return {
    state,
    bindings,
    saved,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  dialog.bindings = null
  userApi.createUser.mockResolvedValue(undefined)
  userApi.updateUser.mockResolvedValue(undefined)
})

afterEach(() => {
  for (const dispose of disposers.splice(0))
    dispose()
})

describe('user form payloads', () => {
  it('keeps the password when creating a user', () => {
    const payload = toCreateUserParams(createForm())
    expect(payload).toMatchObject({
      username: 'alice',
      password: '123456',
      role: 'user',
      status: 'ACTIVE',
      permissions: [],
    })
    expect(payload).not.toHaveProperty('_userId')
  })

  it('drops the password when updating a user', () => {
    const payload = toUpdateUserParams(createForm({ password: 'ignored' }))
    expect(payload).not.toHaveProperty('password')
    expect(payload).not.toHaveProperty('_userId')
  })

  it('normalizes empty optional contact fields for create and update payloads', () => {
    const createPayload = toCreateUserParams(createForm())
    const updatePayload = toUpdateUserParams(createForm())
    expect(createPayload.email).toBeUndefined()
    expect(createPayload.phone).toBeUndefined()
    expect(updatePayload.email).toBeNull()
    expect(updatePayload.phone).toBeNull()
  })

  it('trims optional contact fields without changing password behavior', () => {
    const createPayload = toCreateUserParams(createForm({
      password: ' 123456 ',
      email: ' alice@example.com ',
      phone: ' 13800138000 ',
    }))
    const updatePayload = toUpdateUserParams(createForm({
      password: 'ignored',
      email: ' bob@example.com ',
      phone: ' 13900139000 ',
    }))
    expect(createPayload).toMatchObject({
      password: ' 123456 ',
      email: 'alice@example.com',
      phone: '13800138000',
    })
    expect(updatePayload).not.toHaveProperty('password')
    expect(updatePayload).toMatchObject({
      email: 'bob@example.com',
      phone: '13900139000',
    })
  })
})

describe('userFormDialog save payloads', () => {
  it('clears edit identity when opening create after editing', async () => {
    const { state, bindings, saved } = await mountEditor(createUserRow())
    state.visible = false
    await nextTick()
    state.user = null
    state.visible = true
    await nextTick()
    await vi.waitFor(() => expect(bindings.submitDisabled).toBe(false))
    Object.assign(bindings.model, {
      username: 'bob',
      password: '123456',
    })
    await bindings.onSubmit()
    expect(userApi.createUser).toHaveBeenCalledWith({
      username: 'bob',
      password: '123456',
      email: undefined,
      phone: undefined,
      role: 'user',
      status: 'ACTIVE',
      permissions: [],
      tenantId: null,
      dataScope: 'ALL',
      boundShopIds: [],
    })
    expect(userApi.updateUser).not.toHaveBeenCalled()
    expect(saved).toHaveBeenCalledOnce()
    expect(state.visible).toBe(false)
  })

  it('creates users with password and omits blank optional contact fields', async () => {
    const { bindings } = await mountEditor()
    Object.assign(bindings.model, {
      username: 'alice',
      password: '123456',
      email: ' ',
      phone: '',
    })
    await bindings.onSubmit()
    expect(userApi.createUser).toHaveBeenCalledWith({
      username: 'alice',
      password: '123456',
      email: undefined,
      phone: undefined,
      role: 'user',
      status: 'ACTIVE',
      permissions: [],
      tenantId: null,
      dataScope: 'ALL',
      boundShopIds: [],
    })
    expect(userApi.updateUser).not.toHaveBeenCalled()
  })

  it('updates users without password and clears blank optional contact fields', async () => {
    const { bindings } = await mountEditor(createUserRow())
    Object.assign(bindings.model, {
      password: 'should-not-be-sent',
      email: '',
      phone: ' ',
    })
    await bindings.onSubmit()
    expect(userApi.createUser).not.toHaveBeenCalled()
    expect(userApi.updateUser).toHaveBeenCalledWith(7, {
      username: 'alice',
      email: null,
      phone: null,
      role: 'admin',
      status: 'ACTIVE',
      permissions: ['user:view'],
      tenantId: null,
      dataScope: 'ALL',
      boundShopIds: [],
    })
  })
})

import type { UserFormState } from '../payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, effectScope, ref } from 'vue'
import { toUserPayload } from '../payload'
import { useUserManagement } from '../useUserManagement'

const userApi = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserList: vi.fn(),
  updateUser: vi.fn(),
}))

const permissionApi = vi.hoisted(() => ({
  getButtonPermissions: vi.fn(),
}))

const crudFeedback = vi.hoisted(() => ({
  confirmDelete: vi.fn(),
  notifyDeleteSuccess: vi.fn(),
  notifySaveSuccess: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn(),
  },
}))

vi.mock('@/entities/user', () => userApi)

vi.mock('@/entities/permission', () => permissionApi)

vi.mock('@/entities/session', () => ({
  useAuthStore: () => ({
    userInfo: { id: 99 },
  }),
}))

vi.mock('@/shared/config-crud', async () => {
  const actual = await vi.importActual<typeof import('@/shared/config-crud/model/useConfigCrud')>('@/shared/config-crud/model/useConfigCrud')

  return {
    ...actual,
    createElementPlusCrudFeedback: () => crudFeedback,
  }
})

function createForm(overrides: Partial<UserFormState> = {}): UserFormState {
  return {
    username: 'alice',
    password: '123456',
    email: '',
    phone: '',
    role: 'user',
    status: 1,
    permissions: [],
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
  }))
  userApi.createUser.mockResolvedValue(undefined)
  userApi.deleteUser.mockResolvedValue(undefined)
  userApi.getUserList.mockResolvedValue([])
  userApi.updateUser.mockResolvedValue(undefined)
  permissionApi.getButtonPermissions.mockResolvedValue([])
  crudFeedback.confirmDelete.mockResolvedValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('toUserPayload', () => {
  it('keeps the password when creating a user', () => {
    const payload = toUserPayload(createForm())

    expect(payload).toMatchObject({
      username: 'alice',
      password: '123456',
      role: 'user',
      status: 1,
      permissions: [],
    })
    expect(payload).not.toHaveProperty('_userId')
  })

  it('drops the password when updating a user', () => {
    const payload = toUserPayload(createForm({ _userId: 1, password: 'ignored' }))

    expect(payload).not.toHaveProperty('password')
    expect(payload).not.toHaveProperty('_userId')
  })

  it('normalizes empty optional contact fields for create and update payloads', () => {
    const createPayload = toUserPayload(createForm())
    const updatePayload = toUserPayload(createForm({ _userId: 1 }))

    expect(createPayload.email).toBeUndefined()
    expect(createPayload.phone).toBeUndefined()
    expect(updatePayload.email).toBeNull()
    expect(updatePayload.phone).toBeNull()
  })

  it('trims optional contact fields without changing password behavior', () => {
    const createPayload = toUserPayload(createForm({
      password: ' 123456 ',
      email: ' alice@example.com ',
      phone: ' 13800138000 ',
    }))
    const updatePayload = toUserPayload(createForm({
      _userId: 1,
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

describe('useUserManagement save payloads', () => {
  it('clears edit identity when opening create after editing', async () => {
    const { result: userManagement, dispose } = runInScope(() => useUserManagement())

    try {
      userManagement.openEditDialog({
        id: 7,
        username: 'alice',
        email: 'old@example.com',
        phone: '13800138000',
        avatar: null,
        role: 'admin',
        status: 1,
        permissions: ['user:view'],
        createdAt: '2026-05-22T00:00:00.000Z',
        updatedAt: '2026-05-22T00:00:00.000Z',
      })

      userManagement.openCreateDialog()

      expect(userManagement.isEdit.value).toBe(false)

      Object.assign(userManagement.form, {
        username: 'bob',
        password: '123456',
      })

      await userManagement.submitForm()

      expect(userApi.createUser).toHaveBeenCalledWith({
        username: 'bob',
        password: '123456',
        email: undefined,
        phone: undefined,
        role: 'user',
        status: 1,
        permissions: [],
      })
      expect(userApi.updateUser).not.toHaveBeenCalled()
    }
    finally {
      dispose()
    }
  })

  it('creates users with password and omits blank optional contact fields', async () => {
    const { result: userManagement, dispose } = runInScope(() => useUserManagement())

    try {
      userManagement.openCreateDialog()
      Object.assign(userManagement.form, {
        username: 'alice',
        password: '123456',
        email: ' ',
        phone: '',
      })

      await userManagement.submitForm()

      expect(userApi.createUser).toHaveBeenCalledWith({
        username: 'alice',
        password: '123456',
        email: undefined,
        phone: undefined,
        role: 'user',
        status: 1,
        permissions: [],
      })
      expect(userApi.updateUser).not.toHaveBeenCalled()
      expect(crudFeedback.notifySaveSuccess).toHaveBeenCalledWith('user.createSuccess')
    }
    finally {
      dispose()
    }
  })

  it('updates users without password and clears blank optional contact fields', async () => {
    const { result: userManagement, dispose } = runInScope(() => useUserManagement())

    try {
      userManagement.openEditDialog({
        id: 7,
        username: 'alice',
        email: 'old@example.com',
        phone: '13800138000',
        avatar: null,
        role: 'admin',
        status: 1,
        permissions: ['user:view'],
        createdAt: '2026-05-22T00:00:00.000Z',
        updatedAt: '2026-05-22T00:00:00.000Z',
      })
      Object.assign(userManagement.form, {
        password: 'should-not-be-sent',
        email: '',
        phone: ' ',
      })

      await userManagement.submitForm()

      expect(userApi.createUser).not.toHaveBeenCalled()
      expect(userApi.updateUser).toHaveBeenCalledWith(7, {
        username: 'alice',
        email: null,
        phone: null,
        role: 'admin',
        status: 1,
        permissions: ['user:view'],
      })
      expect(crudFeedback.notifySaveSuccess).toHaveBeenCalledWith('user.updateSuccess')
    }
    finally {
      dispose()
    }
  })
})

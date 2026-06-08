/**
 * @file 用户管理组合式状态
 * @domain features/user-management
 * @description 聚合用户 CRUD、权限选项和自删除保护逻辑，是用户管理页面的业务状态边界。
 */

import type { FormRules } from 'element-plus'
import type { UserFormState } from './payload'
import type { CreateUserParams, UpdateUserParams, UserInfo, UserListQuery } from '@/entities/user'
import { ElMessage } from 'element-plus'
import { getButtonPermissions } from '@/entities/permission'
import { useAuthStore } from '@/entities/session'
import { getTenantList } from '@/entities/tenant'
import { createUser, deleteUser, getUserList, updateUser } from '@/entities/user'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'
import { toUserPayload } from './payload'

export type { UserFormState } from './payload'

const defaultForm: UserFormState = {
  username: '',
  password: '',
  email: '',
  phone: '',
  role: 'user',
  status: 1,
  permissions: [],
  tenantId: null,
  dataScope: 'ALL',
  boundShopIds: [],
  _userId: undefined,
}

/**
 * @description 有副作用：调用用户和权限接口，维护表格/表单状态，并在删除当前用户时触发 Element Plus 警告。
 * @returns 用户管理页面使用的 CRUD 状态、校验规则、权限选项和操作函数。
 */
export function useUserManagement() {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const permissionOptions = ref<{
    label: string
    value: string
  }[]>([])
  const tenantOptions = ref<{
    label: string
    value: number
  }[]>([])
  const shopOptions = ref<{
    label: string
    value: string
  }[]>([])

  const crud = useConfigCrud<UserInfo, UserListQuery, UserFormState, CreateUserParams | UpdateUserParams, number>({
    getDefaultQuery: () => ({
      username: '',
      role: '' as UserListQuery['role'],
      status: '' as UserListQuery['status'],
    }),
    getDefaultForm: () => ({
      ...defaultForm,
      permissions: [],
    }),
    fetchList: async () => {
      const list = await getUserList()
      return list.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin')
          return -1
        if (a.role !== 'admin' && b.role === 'admin')
          return 1
        return a.id - b.id
      })
    },
    createItem: async (payload) => {
      await createUser(payload as CreateUserParams)
    },
    updateItem: async (id, payload) => {
      await updateUser(id, payload)
    },
    deleteItem: async (id) => {
      await deleteUser(id)
    },
    getFormId: form => form._userId as number | undefined ?? 0,
    getRowId: row => row.id,
    filterItem: (item, query) => {
      const usernameMatched = !query.username || item.username.includes(query.username)
      const roleMatched = !query.role || item.role === query.role
      const statusMatched = query.status === '' || String(item.status) === query.status
      return usernameMatched && roleMatched && statusMatched
    },
    toForm: row => ({
      username: row.username,
      password: '',
      email: row.email || '',
      phone: row.phone || '',
      role: row.role,
      status: row.status,
      permissions: [...row.permissions],
      tenantId: row.tenant?.id ?? null,
      dataScope: row.dataScope || 'ALL',
      boundShopIds: [...(row.boundShopIds || [])],
      _userId: row.id,
    }),
    toPayload: toUserPayload,
    deleteConfirm: row => t('user.deleteConfirm', { name: row.username }),
    saveSuccessMessage: ({ isEdit }) => t(isEdit ? 'user.updateSuccess' : 'user.createSuccess'),
    deleteSuccessMessage: t('user.deleteSuccess'),
    feedback: createElementPlusCrudFeedback(),
  })

  const rules = computed<FormRules>(() => ({
    username: [
      {
        required: true,
        message: t('user.usernameRequired'),
        trigger: 'blur',
      },
      {
        min: 2,
        message: t('user.usernameMin'),
        trigger: 'blur',
      },
    ],
    password: [
      {
        required: !crud.isEdit.value,
        message: t('user.passwordRequired'),
        trigger: 'blur',
      },
      {
        min: 6,
        message: t('user.passwordMin'),
        trigger: 'blur',
      },
    ],
    email: [
      {
        type: 'email',
        message: t('user.emailInvalid'),
        trigger: 'blur',
      },
    ],
  }))

  function isSelf(row: UserInfo) {
    return row.id === authStore.userInfo?.id
  }

  async function handleDelete(row: UserInfo) {
    if (isSelf(row)) {
      ElMessage.warning(t('user.cannotDeleteSelf'))
      return
    }
    await crud.handleDelete(row)
  }

  async function fetchPermissionOptions() {
    const buttons = await getButtonPermissions().catch(() => [])
    permissionOptions.value = buttons.map(item => ({
      label: `${item.name}（${item.code}）`,
      value: item.code,
    }))
  }

  async function fetchTenantOptions() {
    const tenants = await getTenantList().catch(() => [])
    tenantOptions.value = tenants.map(t => ({
      label: `${t.name}（${t.code}）`,
      value: t.id,
    }))
  }

  async function fetchShopOptions() {
    interface ShopItem {
      id: number
      name: string
    }
    const restaurants = await request.get<ShopItem[]>(adminEndpoints.commerce.restaurants).catch(() => [])
    shopOptions.value = restaurants.map(r => ({
      label: r.name,
      value: String(r.id),
    }))
  }

  return {
    ...crud,
    rules,
    permissionOptions,
    tenantOptions,
    shopOptions,
    isSelf,
    handleDelete,
    fetchUsers: crud.fetchRows,
    fetchPermissionOptions,
    fetchTenantOptions,
    fetchShopOptions,
  }
}

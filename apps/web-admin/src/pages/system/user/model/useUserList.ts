/**
 * @file 用户列表状态
 * @domain pages/system/user
 * @description 有副作用：加载、筛选和删除用户，维护列表错误与自删除保护。
 */

import type { UserInfo, UserListQuery } from '@/entities/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/entities/session'
import { deleteUser, getUserList } from '@/entities/user'

export function useUserList() {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const users = shallowRef<UserInfo[]>([])
  const query = reactive<UserListQuery>({
    username: '',
    role: '',
    status: '',
  })
  let fetchVersion = 0
  let deleting = false

  const filteredData = computed(() => users.value.filter(user => (
    (!query.username || user.username.includes(query.username))
    && (!query.role || user.role === query.role)
    && (!query.status || user.status === query.status)
  )))

  async function fetchUsers() {
    const version = ++fetchVersion
    loading.value = true
    error.value = null

    try {
      const result = await getUserList()
      // 刷新与页面销毁都会更换版本，旧响应不能覆盖当前列表或清掉新请求的 loading。
      if (version !== fetchVersion)
        return
      users.value = [...result].sort((a, b) => (
        Number(b.role === 'admin') - Number(a.role === 'admin') || a.id - b.id
      ))
    }
    catch (caughtError) {
      if (version === fetchVersion)
        error.value = caughtError
    }
    finally {
      if (version === fetchVersion)
        loading.value = false
    }
  }

  function resetQuery() {
    Object.assign(query, {
      username: '',
      role: '',
      status: '',
    })
  }

  function isSelf(user: UserInfo) {
    return user.id === authStore.userInfo?.id
  }

  async function handleDelete(user: UserInfo) {
    if (isSelf(user)) {
      ElMessage.warning(t('user.cannotDeleteSelf'))
      return
    }
    if (deleting)
      return

    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('user.deleteConfirm', { name: user.username }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed)
        return

      await deleteUser(user.id)
      ElMessage.success(t('user.deleteSuccess'))
      await fetchUsers()
    }
    catch {
      // 删除失败已由 shared HTTP 提示，保留可操作列表，不把它切成加载错误页。
    }
    finally {
      deleting = false
    }
  }

  onScopeDispose(() => {
    fetchVersion++
  })

  return {
    loading,
    error,
    query,
    filteredData,
    resetQuery,
    fetchUsers,
    isSelf,
    handleDelete,
  }
}

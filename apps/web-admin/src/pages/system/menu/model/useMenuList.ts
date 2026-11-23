/**
 * @file 菜单列表状态
 * @domain pages/system/menu
 * @description 有副作用：加载、筛选和删除菜单，维护完整菜单树与列表错误。
 */

import type { MenuItem } from '@/entities/system-menu'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteMenu, getMenus } from '@/entities/system-menu'
import { filterTree } from '@/shared/lib/tree'

export function useMenuList() {
  const { t } = useI18n()
  const menus = shallowRef<MenuItem[]>([])
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const query = reactive({
    title: '',
    status: '',
  })
  let fetchVersion = 0
  let deleting = false
  let disposed = false

  // 表格过滤保留命中后代的祖先；menus 始终保留全树，编辑器选父级不能受搜索条件限制。
  const filteredData = computed(() => filterTree(menus.value, menu => (
    (!query.title || menu.title.includes(query.title))
    && (query.status === '' || String(menu.status) === query.status)
  )))

  async function fetchMenus() {
    if (disposed)
      return
    const version = ++fetchVersion
    loading.value = true
    error.value = null
    try {
      const result = await getMenus()
      // 刷新和销毁都会换版本，旧响应不能覆盖新菜单树或清掉新请求的 loading。
      if (version === fetchVersion)
        menus.value = result
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
      title: '',
      status: '',
    })
  }

  async function handleDelete(menu: MenuItem) {
    if (deleting || disposed)
      return
    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('menu.deleteConfirm', { name: menu.title }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed || disposed)
        return

      await deleteMenu(menu.id)
      if (disposed)
        return
      ElMessage.success(t('crud.deleteSuccess'))
      await fetchMenus()
    }
    catch {
      // 删除失败由共享 HTTP 提示，保留当前菜单树供重试。
    }
    finally {
      deleting = false
    }
  }

  onScopeDispose(() => {
    disposed = true
    fetchVersion++
  })

  return {
    menus,
    loading,
    error,
    query,
    filteredData,
    resetQuery,
    fetchMenus,
    handleDelete,
  }
}

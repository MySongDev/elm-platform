/**
 * @file 部门列表状态
 * @domain pages/system/dept
 * @description 有副作用：加载、筛选和删除部门，维护完整部门树与列表错误。
 */

import type { DeptItem } from './types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { filterTree } from '@/shared/lib/tree'
import { deleteDept, getDepts } from '../api'

interface DeptQuery {
  name: string
  status: string
}

export function useDeptList() {
  const { t } = useI18n()
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const depts = shallowRef<DeptItem[]>([])
  const query = reactive<DeptQuery>({
    name: '',
    status: '',
  })
  let fetchVersion = 0
  let deleting = false
  let disposed = false

  // 表格过滤不能改完整树，否则搜索后的编辑弹窗会丢失未命中的上级选项。
  const filteredData = computed(() => filterTree(depts.value, (dept) => {
    const nameMatched = !query.name || dept.name.includes(query.name)
    const statusMatched = query.status === '' || String(dept.status) === query.status
    return nameMatched && statusMatched
  }))

  async function fetchDepts() {
    if (disposed)
      return

    const version = ++fetchVersion
    loading.value = true
    error.value = null
    try {
      const result = await getDepts()
      // 刷新或销毁后，旧响应不能覆盖当前部门树，也不能清掉新请求的 loading。
      if (version === fetchVersion)
        depts.value = result
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
      name: '',
      status: '',
    })
  }

  async function handleDelete(dept: DeptItem) {
    if (deleting || disposed)
      return

    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('dept.deleteConfirm', { name: dept.name }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed || disposed)
        return

      await deleteDept(dept.id)
      if (disposed)
        return
      ElMessage.success(t('crud.deleteSuccess'))
      await fetchDepts()
    }
    catch {
      // 删除失败由 shared HTTP 提示，保留列表供用户再次操作。
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
    depts,
    loading,
    error,
    query,
    filteredData,
    resetQuery,
    fetchDepts,
    handleDelete,
  }
}

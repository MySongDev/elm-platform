/**
 * @file 餐厅列表状态
 * @domain pages/commerce/restaurant
 * @description 有副作用：加载、筛选和删除餐厅，维护列表加载错误与批量删除流程。
 */

import type { RestaurantItem } from './types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteCommerceRestaurant, getCommerceRestaurants } from '../api'

export interface RestaurantQuery {
  name: string
  category: string
}

export function useRestaurantList() {
  const { t } = useI18n()
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const restaurants = shallowRef<RestaurantItem[]>([])
  const query = reactive<RestaurantQuery>({
    name: '',
    category: '',
  })
  let fetchVersion = 0
  // 单条和批量删除共用锁，确认框未结束时再次点击也不能发起另一轮删除。
  let deleting = false
  let disposed = false

  const filteredData = computed(() => restaurants.value.filter(restaurant => (
    (!query.name || restaurant.name.includes(query.name))
    && (!query.category || restaurant.category.includes(query.category))
  )))

  async function fetchRestaurants() {
    if (disposed)
      return

    const version = ++fetchVersion
    loading.value = true
    error.value = null
    try {
      const result = await getCommerceRestaurants()
      // 后发刷新和页面销毁会更换版本，旧响应不能覆盖列表或清掉新请求的 loading。
      if (version !== fetchVersion)
        return
      restaurants.value = result
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
      category: '',
    })
  }

  async function handleDelete(restaurant: RestaurantItem) {
    if (deleting || disposed)
      return

    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('commerce.restaurant.deleteConfirm', { name: restaurant.name }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed || disposed)
        return

      await deleteCommerceRestaurant(restaurant.id)
      if (disposed)
        return
      ElMessage.success(t('commerce.deleteSuccess'))
      await fetchRestaurants()
    }
    catch {
      // 删除失败由 shared HTTP 提示；刷新失败单独由列表 error 展示。
    }
    finally {
      deleting = false
    }
  }

  async function batchDeleteRows(rows: RestaurantItem[]) {
    if (rows.length === 0 || deleting || disposed)
      return

    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('tableEnhance.batchDeleteConfirm', { count: rows.length }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed || disposed)
        return

      // 删除仍一起发起；部分失败时也须等其余请求结束后刷新，否则表格会留下已删除行。
      const results = await Promise.allSettled(rows.map(row => deleteCommerceRestaurant(row.id)))
      if (disposed)
        return
      if (results.every(result => result.status === 'fulfilled'))
        ElMessage.success(t('commerce.deleteSuccess'))
      await fetchRestaurants()
    }
    catch {
      // 保留 shared HTTP 的失败提示，不能把部分删除失败提示成整批成功。
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
    loading,
    error,
    query,
    filteredData,
    resetQuery,
    fetchRestaurants,
    handleDelete,
    batchDeleteRows,
  }
}

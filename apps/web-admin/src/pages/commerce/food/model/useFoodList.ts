/**
 * @file 食品列表状态
 * @domain pages/commerce/food
 * @description 有副作用：加载、筛选和删除食品，维护列表加载错误。
 */

import type { FoodItem } from './types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onScopeDispose, reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteCommerceFood, getCommerceFoods } from '../api'

export interface FoodQuery {
  name: string
  restaurantId: string
}

export function useFoodList() {
  const { t } = useI18n()
  const loading = shallowRef(false)
  const error = shallowRef<unknown>(null)
  const foods = shallowRef<FoodItem[]>([])
  const query = reactive<FoodQuery>({
    name: '',
    restaurantId: '',
  })
  let fetchVersion = 0
  let deleting = false
  let disposed = false

  const filteredData = computed(() => foods.value.filter(food => (
    (!query.name || food.name.includes(query.name))
    && (!query.restaurantId || String(food.restaurant_id) === query.restaurantId)
  )))

  async function fetchFoods() {
    if (disposed)
      return

    const version = ++fetchVersion
    loading.value = true
    error.value = null
    try {
      const result = await getCommerceFoods()
      // 后发刷新和页面销毁会更换版本，旧响应不能覆盖列表或清掉新请求的 loading。
      if (version !== fetchVersion)
        return
      foods.value = result
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
      restaurantId: '',
    })
  }

  async function handleDelete(food: FoodItem) {
    if (deleting || disposed)
      return

    deleting = true
    try {
      const confirmed = await ElMessageBox.confirm(
        t('commerce.food.deleteConfirm', { name: food.name }),
        t('common.tip'),
        { type: 'warning' },
      ).then(() => true, () => false)
      if (!confirmed || disposed)
        return

      await deleteCommerceFood(food.item_id)
      if (disposed)
        return
      ElMessage.success(t('commerce.deleteSuccess'))
      await fetchFoods()
    }
    catch {
      // 删除失败由 shared HTTP 提示；列表刷新失败单独由 error 展示，保留删除成功反馈。
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
    fetchFoods,
    handleDelete,
  }
}

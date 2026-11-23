/**
 * @file 食品列表流程回归
 * @domain pages/commerce/food
 * @description 将原公共 CRUD 的取消删除、加载失败重试和全量请求场景迁到业务列表。
 */

import type { FoodItem } from '../types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useFoodList } from '../useFoodList'

const api = vi.hoisted(() => ({
  getCommerceFoods: vi.fn(),
  deleteCommerceFood: vi.fn(),
}))
vi.mock('../../api', () => api)
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}))

const food: FoodItem = {
  _id: 'food-7',
  item_id: 7,
  restaurant_id: 2,
  category_id: 3,
  name: 'Rice',
  image_path: '',
  description: '',
  month_sales: 0,
  satisfy_rate: 0,
  rating: 0,
  specfoods: [],
  createdAt: '',
}
const scopes: ReturnType<typeof effectScope>[] = []
function createList() {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(useFoodList)!
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getCommerceFoods.mockReset().mockResolvedValue([food])
  api.deleteCommerceFood.mockReset().mockResolvedValue(undefined)
  vi.mocked(ElMessageBox.confirm).mockReset()
})
afterEach(() => {
  for (const scope of scopes.splice(0))
    scope.stop()
})

describe('food list workflow', () => {
  it('skips deletion when confirmation is cancelled', async () => {
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce('cancel')
    await createList().handleDelete(food)
    expect(ElMessageBox.confirm).toHaveBeenCalledWith('commerce.food.deleteConfirm', 'common.tip', { type: 'warning' })
    expect(api.deleteCommerceFood).not.toHaveBeenCalled()
    expect(api.getCommerceFoods).not.toHaveBeenCalled()
    expect(ElMessage.success).not.toHaveBeenCalled()
  })

  it('records load errors and recovers on retry', async () => {
    const error = new Error('fetch failed')
    api.getCommerceFoods.mockRejectedValueOnce(error)
    const list = createList()
    await list.fetchFoods()
    expect(list.error.value).toBe(error)
    expect(list.loading.value).toBe(false)
    await list.fetchFoods()
    expect(list.error.value).toBeNull()
    expect(list.filteredData.value).toEqual([food])
  })

  it('requests the whole list without pagination arguments', async () => {
    const list = createList()
    await list.fetchFoods()
    expect(api.getCommerceFoods).toHaveBeenCalledOnce()
    expect(api.getCommerceFoods).toHaveBeenCalledWith()
    expect(list.filteredData.value).toEqual([food])
  })
})

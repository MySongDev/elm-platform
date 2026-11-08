import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { getCategoryFoods } from '@/services/api/api-shop'
import { useCategoryFoods } from './useCategoryFoods'

vi.mock('@/services/api/api-shop', () => ({ getCategoryFoods: vi.fn() }))

const scopes = []
function createMenu() {
  const scope = effectScope()
  scopes.push(scope)
  const shopId = ref('42')
  const menu = scope.run(() => useCategoryFoods(shopId))
  menu.resetMenu([{ id: 7 }, { id: 8 }])
  return {
    ...menu,
    shopId,
    scope,
  }
}

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return {
    promise,
    resolve,
  }
}

beforeEach(() => vi.resetAllMocks())
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

describe('分类分页会话', () => {
  it('初始化只创建占位分类，不自动下载所有菜品', () => {
    const menu = createMenu()
    expect(menu.activeCategoryId.value).toBe(7)
    expect(menu.foodMenuData.value.map(category => category.foods)).toEqual([[], []])
    expect(getCategoryFoods).not.toHaveBeenCalled()
  })

  it('重复触发共用一页请求，后续页按服务端 offset 追加并去重', async () => {
    const menu = createMenu()
    const first = deferred()
    getCategoryFoods.mockReturnValueOnce(first.promise)
    const request = menu.loadCategoryFoods(7)
    expect(menu.loadCategoryFoods(7)).toBe(request)
    await Promise.resolve()
    expect(getCategoryFoods).toHaveBeenCalledTimes(1)
    first.resolve({
      items: [{ item_id: 1 }, { item_id: 2 }],
      has_more: true,
      next_offset: 2,
    })
    await request
    getCategoryFoods.mockResolvedValueOnce({
      items: [{ item_id: 2 }, { item_id: 3 }],
      has_more: false,
      next_offset: null,
    })
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenLastCalledWith('42', 7, 2, 20)
    expect(menu.foodMenuData.value[0].foods.map(food => food.item_id)).toEqual([1, 2, 3])
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenCalledTimes(2)
    expect(menu.foodMenuData.value[1].loaded).toBe(false)
  })

  it('下一页失败保留现有菜品和 offset，只允许显式重试', async () => {
    const menu = createMenu()
    getCategoryFoods.mockResolvedValueOnce({
      items: [{ item_id: 1 }],
      has_more: true,
      next_offset: 1,
    })
    await menu.loadCategoryFoods(7)
    getCategoryFoods.mockRejectedValueOnce(new Error('网络中断'))
    await menu.loadCategoryFoods(7)
    expect(menu.foodMenuData.value[0].foods).toEqual([{ item_id: 1 }])
    expect(menu.foodMenuData.value[0].loadError).toBe(true)
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenCalledTimes(2)
    getCategoryFoods.mockResolvedValueOnce({
      items: [{ item_id: 2 }],
      has_more: false,
      next_offset: null,
    })
    await menu.loadCategoryFoods(7, { retry: true })
    expect(getCategoryFoods).toHaveBeenLastCalledWith('42', 7, 1, 20)
    expect(menu.foodMenuData.value[0].loadError).toBe(false)
    expect(menu.foodMenuData.value[0].foods).toHaveLength(2)
  })

  it('换店后的旧响应不会覆盖新分类，也不会清掉新请求锁', async () => {
    const menu = createMenu()
    const oldPage = deferred()
    const newPage = deferred()
    getCategoryFoods.mockReturnValueOnce(oldPage.promise).mockReturnValueOnce(newPage.promise)
    const oldRequest = menu.loadCategoryFoods(7)
    await Promise.resolve()
    menu.shopId.value = '43'
    menu.resetMenu([{ id: 7 }])
    const newRequest = menu.loadCategoryFoods(7)
    oldPage.resolve({
      items: [{ item_id: 1 }],
      has_more: false,
      next_offset: null,
    })
    await oldRequest
    expect(menu.foodMenuData.value[0].foods).toEqual([])
    expect(menu.foodMenuData.value[0].loading).toBe(true)
    expect(menu.loadCategoryFoods(7)).toBe(newRequest)
    newPage.resolve({
      items: [{ item_id: 9 }],
      has_more: false,
      next_offset: null,
    })
    await newRequest
    expect(menu.foodMenuData.value[0].foods).toEqual([{ item_id: 9 }])
  })

  it('空分类停止请求；页面销毁后在途响应不再回写', async () => {
    const menu = createMenu()
    getCategoryFoods.mockResolvedValueOnce({
      items: [],
      has_more: false,
      next_offset: null,
    })
    await menu.loadCategoryFoods(7)
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenCalledTimes(1)
    expect(menu.foodMenuData.value[0].loaded).toBe(true)
    const page = deferred()
    getCategoryFoods.mockReturnValueOnce(page.promise)
    const request = menu.loadCategoryFoods(8)
    await Promise.resolve()
    menu.scope.stop()
    page.resolve({
      items: [{ item_id: 2 }],
      has_more: false,
      next_offset: null,
    })
    await request
    expect(menu.foodMenuData.value[1].foods).toEqual([])
  })

  it('拒绝不前进的 offset，防止可视区检查无限取同一页', async () => {
    const menu = createMenu()
    getCategoryFoods.mockResolvedValueOnce({
      items: [{ item_id: 1 }],
      has_more: true,
      next_offset: 0,
    })
    await menu.loadCategoryFoods(7)
    expect(menu.foodMenuData.value[0].loadError).toBe(true)
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenCalledTimes(1)
  })
})

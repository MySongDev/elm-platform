import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { getCategoryFoods } from '@/services/api/api-shop'
import { useCategoryFoods } from './useCategoryFoods'

vi.mock('@/services/api/api-shop', () => ({ getCategoryFoods: vi.fn() }))

// uni-user 锁定 Vue 3.4，需在本端运行时验证会话清理，不能只依赖 H5 的 Vue 3.5 测试。
const scopes = []
function createMenu() {
  const scope = effectScope()
  scopes.push(scope)
  const menu = scope.run(() => useCategoryFoods(ref('42')))
  menu.resetMenu([{ id: 7 }, { id: 8 }])
  return menu
}

beforeEach(() => vi.resetAllMocks())
afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

describe('小程序分类分页会话', () => {
  it('不全量加载，重复触发只请求一页，末页停止', async () => {
    const menu = createMenu()
    expect(getCategoryFoods).not.toHaveBeenCalled()
    getCategoryFoods.mockResolvedValueOnce({
      items: [{ item_id: 1 }],
      has_more: false,
      next_offset: null,
    })
    const request = menu.loadCategoryFoods(7)
    expect(menu.loadCategoryFoods(7)).toBe(request)
    await request
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenCalledTimes(1)
    expect(menu.foodMenuData.value[0].foods).toEqual([{ item_id: 1 }])
    expect(menu.foodMenuData.value[1].loaded).toBe(false)
  })

  it('失败后不因滚动反复请求，显式重试仍使用原 offset', async () => {
    const menu = createMenu()
    getCategoryFoods.mockRejectedValueOnce(new Error('断网'))
    await menu.loadCategoryFoods(7)
    await menu.loadCategoryFoods(7)
    expect(getCategoryFoods).toHaveBeenCalledTimes(1)
    getCategoryFoods.mockResolvedValueOnce({
      items: [],
      has_more: false,
      next_offset: null,
    })
    await menu.loadCategoryFoods(7, { retry: true })
    expect(getCategoryFoods).toHaveBeenLastCalledWith('42', 7, 0, 20)
    expect(menu.foodMenuData.value[0].loadError).toBe(false)
    expect(menu.foodMenuData.value[0].loaded).toBe(true)
  })

  it('重载菜单后旧响应不能回写；页面销毁也使在途请求失效', async () => {
    const menu = createMenu()
    let resolve
    getCategoryFoods.mockReturnValueOnce(new Promise((done) => { resolve = done }))
    const request = menu.loadCategoryFoods(7)
    await Promise.resolve()
    menu.resetMenu([{ id: 9 }])
    resolve({
      items: [{ item_id: 1 }],
      has_more: false,
      next_offset: null,
    })
    await request
    expect(menu.foodMenuData.value.map(category => category.id)).toEqual([9])
    expect(menu.foodMenuData.value[0].foods).toEqual([])
    getCategoryFoods.mockReturnValueOnce(new Promise((done) => { resolve = done }))
    const lastRequest = menu.loadCategoryFoods(9)
    await Promise.resolve()
    scopes[0].stop()
    resolve({
      items: [{ item_id: 2 }],
      has_more: false,
      next_offset: null,
    })
    await lastRequest
    expect(menu.foodMenuData.value[0].foods).toEqual([])
  })
})

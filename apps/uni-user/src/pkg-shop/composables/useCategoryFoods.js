// 与 web-user 的 useCategoryFoods.js 同源；端差异只在可视区触发方式，不在分页规则。
import { onScopeDispose, ref } from 'vue'
import { getCategoryFoods } from '@/services/api/api-shop'

const PAGE_SIZE = 20

/**
 * 分类内的分页会话：只在当前店铺页面内复用已加载的菜品，不做跨页面持久化缓存。
 * 每次重新加载店铺都 resetMenu；旧请求即使无法取消，也不能回写新会话。
 * 同一分类同一时刻只取一页，避免点击、滚动和可视区检查同时推进 offset。
 */
export function useCategoryFoods(shopId) {
  const foodMenuData = ref([])
  const activeCategoryId = ref(null)
  const pending = new Map()
  let revision = 0

  function resetMenu(categories = []) {
    revision += 1
    pending.clear()
    foodMenuData.value = categories.map(category => ({
      ...category,
      foods: [],
      loaded: false,
      loading: false,
      loadError: false,
      hasMore: true,
      offset: 0,
    }))
    activeCategoryId.value = foodMenuData.value[0]?.id ?? null
  }

  function updateCategory(id, patch) {
    foodMenuData.value = foodMenuData.value.map(category =>
      String(category.id) === String(id)
        ? {
            ...category,
            ...patch,
          }
        : category,
    )
  }

  /** 失败不自动重试：否则可视区回调会不停回源；只有用户点重试才解除错误态。 */
  function loadCategoryFoods(id, { retry = false } = {}) {
    const category = foodMenuData.value.find(item => String(item.id) === String(id))
    if (!category || !shopId.value || !category.hasMore || (category.loadError && !retry)) {
      return Promise.resolve()
    }
    const key = String(id)
    if (pending.has(key)) {
      return pending.get(key)
    }

    const requestRevision = revision
    const restaurantId = shopId.value
    updateCategory(id, {
      loading: true,
      loadError: false,
    })
    const promise = Promise.resolve().then(async () => {
      try {
        const page = await getCategoryFoods(restaurantId, id, category.offset, PAGE_SIZE)
        if (requestRevision !== revision) {
          return
        }
        if (!Array.isArray(page?.items) || typeof page.has_more !== 'boolean'
          || (page.has_more && (!Number.isInteger(page.next_offset) || page.next_offset <= category.offset))) {
          throw new Error('菜品分页响应格式错误')
        }
        // offset 分页遇到菜单编辑可能重复返回旧项；按 item_id 去重，但游标仍取服务端值。
        const seen = new Set(category.foods.map(food => food.item_id))
        const added = page.items.filter((food) => {
          if (seen.has(food.item_id)) {
            return false
          }
          seen.add(food.item_id)
          return true
        })
        updateCategory(id, {
          foods: [...category.foods, ...added],
          loaded: true,
          hasMore: page.has_more,
          offset: page.next_offset ?? category.offset + page.items.length,
        })
      }
      catch {
        if (requestRevision === revision) {
          updateCategory(id, { loadError: true })
        }
      }
      finally {
        if (requestRevision === revision) {
          updateCategory(id, { loading: false })
          pending.delete(key)
        }
      }
    })
    pending.set(key, promise)
    return promise
  }

  onScopeDispose(() => {
    revision += 1
    pending.clear()
  })

  return {
    foodMenuData,
    activeCategoryId,
    resetMenu,
    loadCategoryFoods,
  }
}

/**
 * @file 食品管理组合式状态
 * @domain features/food-management
 * @description 聚合食品 CRUD、specfoods 表单转换和表单校验，是食品管理页面的业务状态边界。
 */

import type { FormRules } from 'element-plus'
import type { FoodItem, FoodPayload } from '@/entities/food'
import { createCommerceFood, deleteCommerceFood, getCommerceFoods, updateCommerceFood } from '@/entities/food'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'

export interface FoodQuery {
  name: string
  restaurantId: string
}

export interface FoodFormState {
  item_id: number
  restaurant_id: number
  category_id: number
  name: string
  image_path: string
  description: string
  month_sales: number
  satisfy_rate: number
  rating: number
  price: number
  packing_fee: number
  original_price: number
}

const defaultForm: FoodFormState = {
  item_id: 0,
  restaurant_id: 0,
  category_id: 0,
  name: '',
  image_path: '',
  description: '',
  month_sales: 0,
  satisfy_rate: 100,
  rating: 0,
  price: 0,
  packing_fee: 0,
  original_price: 0,
}

/**
 * @description 读取食品首个规格价格；旧接口把价格放在 specfoods 数组中，缺失规格时展示为 0。
 * @param row 食品记录。
 * @returns 食品展示价格。
 */
export function getFoodPrice(row: FoodItem) {
  return row.specfoods?.[0]?.price ?? 0
}

/**
 * @description 有副作用：调用食品接口，维护食品表格/表单状态，并在保存时把扁平表单还原为 specfoods 载荷。
 * @returns 食品管理页面使用的 CRUD 状态、校验规则和操作函数。
 */
export function useFoodManagement() {
  const { t } = useI18n()

  const crud = useConfigCrud<FoodItem, FoodQuery, FoodFormState, FoodPayload>({
    getDefaultQuery: () => ({ name: '', restaurantId: '' }),
    getDefaultForm: () => ({ ...defaultForm }),
    fetchList: getCommerceFoods,
    createItem: createCommerceFood,
    updateItem: updateCommerceFood,
    deleteItem: deleteCommerceFood,
    getFormId: form => form.item_id,
    getRowId: row => row.item_id,
    filterItem: (item, query) => {
      const nameMatched = !query.name || item.name.includes(query.name)
      const restaurantMatched = !query.restaurantId || String(item.restaurant_id) === query.restaurantId
      return nameMatched && restaurantMatched
    },
    toForm: (row) => {
      const spec = row.specfoods?.[0]
      return {
        item_id: row.item_id,
        restaurant_id: row.restaurant_id,
        category_id: row.category_id,
        name: row.name,
        image_path: row.image_path,
        description: row.description,
        month_sales: row.month_sales,
        satisfy_rate: row.satisfy_rate,
        rating: row.rating,
        price: spec?.price ?? 0,
        packing_fee: spec?.packing_fee ?? 0,
        original_price: spec?.original_price ?? 0,
      }
    },
    toPayload: form => ({
      item_id: form.item_id,
      restaurant_id: form.restaurant_id,
      category_id: form.category_id,
      name: form.name,
      image_path: form.image_path,
      description: form.description,
      month_sales: form.month_sales,
      satisfy_rate: form.satisfy_rate,
      rating: form.rating,
      specfoods: [{
        price: form.price,
        packing_fee: form.packing_fee,
        original_price: form.original_price,
      }],
    }),
    deleteConfirm: row => t('commerce.food.deleteConfirm', { name: row.name }),
    saveSuccessMessage: t('commerce.saveSuccess'),
    deleteSuccessMessage: t('commerce.deleteSuccess'),
    feedback: createElementPlusCrudFeedback(),
  })

  const rules: FormRules = {
    name: [{ required: true, message: t('commerce.food.nameRequired'), trigger: 'blur' }],
    restaurant_id: [{ required: true, message: t('commerce.food.restaurantIdRequired'), trigger: 'blur' }],
  }

  return {
    ...crud,
    rules,
  }
}

/**
 * @file 食品编辑草稿与载荷转换
 * @domain pages/commerce/food
 * @description 创建独立食品草稿，将首个规格的金额字段还原为现有单规格载荷。
 */

import type { FoodItem, FoodPayload } from './types'

export interface FoodFormState {
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

/** 草稿只取可编辑字段，避免把列表行的身份和嵌套规格带进表单。 */
export function createFoodForm(food: FoodItem | null = null): FoodFormState {
  const spec = food?.specfoods?.[0]
  return {
    restaurant_id: food?.restaurant_id ?? 0,
    category_id: food?.category_id ?? 0,
    name: food?.name ?? '',
    image_path: food?.image_path ?? '',
    description: food?.description ?? '',
    month_sales: food?.month_sales ?? 0,
    satisfy_rate: food?.satisfy_rate ?? 100,
    rating: food?.rating ?? 0,
    price: spec?.price ?? 0,
    packing_fee: spec?.packing_fee ?? 0,
    original_price: spec?.original_price ?? 0,
  }
}

/** 身份取自选中的食品；继续保存一个规格，不能悄悄扩展成多规格编辑。 */
export function toFoodPayload(form: FoodFormState, food: FoodItem | null): FoodPayload {
  return {
    item_id: food?.item_id ?? 0,
    restaurant_id: form.restaurant_id,
    category_id: form.category_id,
    name: form.name,
    image_path: form.image_path,
    description: form.description,
    month_sales: form.month_sales,
    satisfy_rate: form.satisfy_rate,
    rating: form.rating,
    specfoods: [
      {
        price: form.price,
        packing_fee: form.packing_fee,
        original_price: form.original_price,
      },
    ],
  }
}

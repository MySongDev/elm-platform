/**
 * @file 食品管理字段配置
 * @domain features/food-management
 * @description 定义食品查询表单、编辑表单和表格列字段，供配置化 CRUD 组件渲染。
 */

import type { FoodItem } from '@/entities/food'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'

export function createFoodSearchFields(t: Translate) {
  return [
    { prop: 'name', label: t('commerce.food.name'), type: 'input', placeholder: t('commerce.food.namePlaceholder') },
    { prop: 'restaurantId', label: t('commerce.food.restaurantId'), type: 'input', placeholder: t('commerce.food.restaurantIdPlaceholder') },
  ] satisfies ConfigFormField[]
}

export function createFoodFormFields(t: Translate) {
  return [
    { prop: 'name', label: t('commerce.food.name'), type: 'input', placeholder: t('commerce.food.namePlaceholder') },
    { prop: 'restaurant_id', label: t('commerce.food.restaurantId'), type: 'inputNumber', min: 0 },
    { prop: 'category_id', label: t('commerce.food.categoryId'), type: 'inputNumber', min: 0 },
    { prop: 'image_path', label: t('commerce.food.image'), type: 'input', placeholder: t('commerce.food.imagePlaceholder') },
    { prop: 'price', label: t('commerce.food.price'), type: 'inputNumber', min: 0, precision: 2 },
    { prop: 'packing_fee', label: t('commerce.food.packingFee'), type: 'inputNumber', min: 0, precision: 2 },
    { prop: 'original_price', label: t('commerce.food.originalPrice'), type: 'inputNumber', min: 0, precision: 2 },
    { prop: 'month_sales', label: t('commerce.food.monthlySales'), type: 'inputNumber', min: 0 },
    { prop: 'satisfy_rate', label: t('commerce.food.satisfactionRate'), type: 'inputNumber', min: 0, max: 100 },
    { prop: 'rating', label: t('commerce.food.rating'), type: 'inputNumber', min: 0, max: 5, step: 0.1 },
    { prop: 'description', label: t('commerce.food.description'), type: 'textarea', placeholder: t('commerce.food.descriptionPlaceholder'), rows: 3 },
  ] satisfies ConfigFormField[]
}

export function createFoodTableColumns(t: Translate) {
  return [
    { prop: 'name', label: t('commerce.food.name'), minWidth: 160 },
    { prop: 'restaurant_id', label: t('commerce.food.restaurantId'), width: 100 },
    { prop: 'category_id', label: t('commerce.food.categoryId'), width: 100 },
    { label: t('commerce.food.price'), width: 100, formatter: row => `¥${row.specfoods?.[0]?.price ?? 0}` },
    { prop: 'month_sales', label: t('commerce.food.monthlySales'), width: 100 },
    { label: t('commerce.food.satisfactionRate'), width: 100, formatter: row => `${row.satisfy_rate}%` },
    { prop: 'rating', label: t('commerce.food.rating'), width: 90 },
    { prop: 'description', label: t('commerce.food.description'), minWidth: 220, showOverflowTooltip: true },
  ] satisfies ConfigTableColumn<FoodItem>[]
}

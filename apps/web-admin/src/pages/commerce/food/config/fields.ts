/**
 * @file 食品管理字段配置
 * @domain features/food-management
 * @description 定义食品查询字段和表格列，编辑字段由食品编辑器管理。
 */

import type { FoodItem } from '../model/types'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'

export function createFoodSearchFields(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('commerce.food.name'),
      type: 'input',
      placeholder: t('commerce.food.namePlaceholder'),
    },
    {
      prop: 'restaurantId',
      label: t('commerce.food.restaurantId'),
      type: 'input',
      placeholder: t('commerce.food.restaurantIdPlaceholder'),
    },
  ] satisfies ConfigFormField[]
}

export function createFoodTableColumns(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('commerce.food.name'),
      minWidth: 160,
    },
    {
      prop: 'restaurant_id',
      label: t('commerce.food.restaurantId'),
      width: 100,
    },
    {
      prop: 'category_id',
      label: t('commerce.food.categoryId'),
      width: 100,
    },
    {
      label: t('commerce.food.price'),
      width: 100,
      formatter: row => `¥${row.specfoods?.[0]?.price ?? 0}`,
    },
    {
      prop: 'month_sales',
      label: t('commerce.food.monthlySales'),
      width: 100,
    },
    {
      label: t('commerce.food.satisfactionRate'),
      width: 100,
      formatter: row => `${row.satisfy_rate}%`,
    },
    {
      prop: 'rating',
      label: t('commerce.food.rating'),
      width: 90,
    },
    {
      prop: 'description',
      label: t('commerce.food.description'),
      minWidth: 220,
      showOverflowTooltip: true,
    },
  ] satisfies ConfigTableColumn<FoodItem>[]
}

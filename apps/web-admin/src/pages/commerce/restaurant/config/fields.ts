/**
 * @file 餐馆管理字段配置
 * @domain features/restaurant-management
 * @description 定义餐厅查询字段和表格列，编辑字段由餐厅编辑器管理。
 */

import type { RestaurantItem } from '../model/types'
import type { ConfigTableColumn, Translate } from '@/shared/config-crud'
import type { AdminSearchField } from '@/shared/ui/AdminSearchForm/types'

export function createRestaurantSearchFields(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('commerce.restaurant.name'),
      type: 'input',
      placeholder: t('commerce.restaurant.namePlaceholder'),
    },
    {
      prop: 'category',
      label: t('commerce.restaurant.category'),
      type: 'input',
      placeholder: t('commerce.restaurant.categoryPlaceholder'),
    },
  ] satisfies AdminSearchField[]
}

export function createRestaurantTableColumns(t: Translate) {
  return [
    {
      prop: 'name',
      label: t('commerce.restaurant.name'),
      minWidth: 160,
    },
    {
      prop: 'category',
      label: t('commerce.restaurant.category'),
      minWidth: 120,
    },
    {
      prop: 'rating',
      label: t('commerce.restaurant.rating'),
      width: 90,
    },
    {
      prop: 'recent_order_num',
      label: t('commerce.restaurant.recentOrders'),
      width: 110,
    },
    {
      prop: 'float_minimum_order_amount',
      label: t('commerce.restaurant.minOrderAmount'),
      width: 100,
    },
    {
      prop: 'float_delivery_fee',
      label: t('commerce.restaurant.deliveryFee'),
      width: 100,
    },
    {
      prop: 'phone',
      label: t('commerce.restaurant.phone'),
      minWidth: 140,
    },
    {
      prop: 'address',
      label: t('commerce.restaurant.address'),
      minWidth: 220,
      showOverflowTooltip: true,
    },
  ] satisfies ConfigTableColumn<RestaurantItem>[]
}

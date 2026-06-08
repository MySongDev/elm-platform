/**
 * @file 餐馆管理字段配置
 * @domain features/restaurant-management
 * @description 定义餐馆查询表单、编辑表单和表格列字段，供配置化 CRUD 组件渲染。
 */

import type { RestaurantItem } from '@/entities/restaurant'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'

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
  ] satisfies ConfigFormField[]
}

export function createRestaurantFormFields(t: Translate) {
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
    {
      prop: 'address',
      label: t('commerce.restaurant.address'),
      type: 'input',
      placeholder: t('commerce.restaurant.addressPlaceholder'),
    },
    {
      prop: 'phone',
      label: t('commerce.restaurant.phone'),
      type: 'input',
      placeholder: t('commerce.restaurant.phonePlaceholder'),
    },
    {
      prop: 'image_path',
      label: t('commerce.restaurant.image'),
      type: 'input',
      placeholder: t('commerce.restaurant.imagePlaceholder'),
    },
    {
      prop: 'rating',
      label: t('commerce.restaurant.rating'),
      type: 'inputNumber',
      min: 0,
      max: 5,
      step: 0.1,
    },
    {
      prop: 'recent_order_num',
      label: t('commerce.restaurant.recentOrders'),
      type: 'inputNumber',
      min: 0,
    },
    {
      prop: 'float_minimum_order_amount',
      label: t('commerce.restaurant.minOrderAmount'),
      type: 'inputNumber',
      min: 0,
    },
    {
      prop: 'float_delivery_fee',
      label: t('commerce.restaurant.deliveryFee'),
      type: 'inputNumber',
      min: 0,
    },
    {
      prop: 'distance',
      label: t('commerce.restaurant.distance'),
      type: 'input',
      placeholder: t('commerce.restaurant.distancePlaceholder'),
    },
    {
      prop: 'order_lead_time',
      label: t('commerce.restaurant.deliveryTime'),
      type: 'input',
      placeholder: t('commerce.restaurant.deliveryTimePlaceholder'),
    },
    {
      prop: 'description',
      label: t('commerce.restaurant.description'),
      type: 'textarea',
      placeholder: t('commerce.restaurant.descriptionPlaceholder'),
      rows: 3,
    },
  ] satisfies ConfigFormField[]
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

/**
 * @file 订单管理字段配置
 * @domain features/order-management
 * @description 定义订单查询表单、状态编辑表单和表格列字段，供配置化 CRUD 组件渲染。
 */

import type { OrderItem } from '@/entities/order'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { formatDateTime } from '@/shared/config-crud'
import { getOrderStatusType } from '../model/useOrderManagement'

function createOrderStatusOptions(t: Translate) {
  return [
    { label: t('commerce.order.pending'), value: 'pending' },
    { label: t('commerce.order.paid'), value: 'paid' },
    { label: t('commerce.order.closed'), value: 'closed' },
  ]
}

export function createOrderSearchFields(t: Translate) {
  return [
    { prop: 'orderNo', label: t('commerce.order.orderNo'), type: 'input', placeholder: t('commerce.order.orderNoPlaceholder') },
    { prop: 'status', label: t('commerce.order.status'), type: 'select', placeholder: t('commerce.order.statusPlaceholder'), options: createOrderStatusOptions(t) },
  ] satisfies ConfigFormField[]
}

export function createOrderStatusFields(t: Translate) {
  return [
    { prop: 'status', label: t('commerce.order.status'), type: 'radio', options: createOrderStatusOptions(t) },
  ] satisfies ConfigFormField[]
}

export function createOrderTableColumns(t: Translate) {
  return [
    { prop: 'orderNo', label: t('commerce.order.orderNo'), minWidth: 180 },
    { prop: 'restaurantName', label: t('commerce.order.restaurant'), minWidth: 160 },
    { prop: 'userId', label: t('commerce.order.userId'), width: 100 },
    { label: t('commerce.order.amount'), width: 100, formatter: row => `¥${row.amount}` },
    { label: t('commerce.order.status'), width: 110, tag: row => ({ label: row.status, type: getOrderStatusType(row.status) }) },
    { label: t('commerce.order.createdAt'), minWidth: 180, formatter: row => formatDateTime(row.createdAt) },
  ] satisfies ConfigTableColumn<OrderItem>[]
}

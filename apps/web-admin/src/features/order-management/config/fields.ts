/**
 * @file 订单管理字段配置
 * @domain features/order-management
 * @description 定义订单查询表单和真实支付订单表格列字段，供配置化 CRUD 组件渲染。
 */

import type { OrderItem } from '@/entities/order'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { formatDateTime } from '@/shared/lib/admin-display'
import { getOrderStatusType } from '../model/useOrderManagement'

function createOrderStatusOptions(t: Translate) {
  return [
    { label: t('commerce.order.pending'), value: 'PENDING' },
    { label: t('commerce.order.paid'), value: 'PAID' },
    { label: t('commerce.order.closed'), value: 'CLOSED' },
  ]
}

export function createOrderSearchFields(t: Translate) {
  return [
    { prop: 'orderNo', label: t('commerce.order.orderNo'), type: 'input', placeholder: t('commerce.order.orderNoPlaceholder') },
    { prop: 'status', label: t('commerce.order.status'), type: 'select', placeholder: t('commerce.order.statusPlaceholder'), options: createOrderStatusOptions(t) },
  ] satisfies ConfigFormField[]
}

export function createOrderTableColumns(t: Translate) {
  return [
    { prop: 'orderNo', label: t('commerce.order.orderNo'), minWidth: 190 },
    { prop: 'shopName', label: t('commerce.order.restaurant'), minWidth: 160 },
    { prop: 'userId', label: t('commerce.order.userId'), width: 110 },
    { label: t('commerce.order.amount'), width: 110, formatter: row => `¥${Number(row.payableAmount || 0).toFixed(2)}` },
    { label: t('commerce.order.status'), width: 110, tag: row => ({ label: row.status, type: getOrderStatusType(row.status) }) },
    { prop: 'tradeStatus', label: '支付宝状态', minWidth: 150 },
    { label: '支付时间', minWidth: 180, formatter: row => row.paidAt ? formatDateTime(row.paidAt) : '-' },
    { label: t('commerce.order.createdAt'), minWidth: 180, formatter: row => formatDateTime(row.createdAt) },
  ] satisfies ConfigTableColumn<OrderItem>[]
}

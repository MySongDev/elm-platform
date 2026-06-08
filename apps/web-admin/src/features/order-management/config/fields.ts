/**
 * @file 订单管理字段配置
 * @domain features/order-management
 * @description 定义订单查询表单和真实支付订单表格列字段，供配置化 CRUD 组件渲染。
 */

import type { FulfillmentStatus, OrderItem, RefundStatus } from '@/entities/order'
import type { ConfigFormField, ConfigTableColumn, Translate } from '@/shared/config-crud'
import { formatDateTime } from '@/shared/lib/admin-display'
import {
  fulfillmentStatusLabelMap,
  getFulfillmentStatusType,
  getPaymentStatusType,
  getRefundStatusType,
  paymentStatusLabelMap,
  refundStatusLabelMap,
} from './workflow'

function createOptions<T extends string>(values: T[], labelMap: Record<T, string>, t: Translate) {
  return values.map(value => ({
    label: t(labelMap[value]),
    value,
  }))
}

export function createOrderSearchFields(t: Translate) {
  return [
    {
      prop: 'orderNo',
      label: t('commerce.order.orderNo'),
      type: 'input',
      placeholder: t('commerce.order.orderNoPlaceholder'),
    },
    {
      prop: 'status',
      label: t('commerce.order.paymentStatus'),
      type: 'select',
      placeholder: t('commerce.order.statusPlaceholder'),
      options: createOptions(['PENDING', 'PAID', 'CLOSED'], paymentStatusLabelMap, t),
    },
    {
      prop: 'fulfillmentStatus',
      label: t('commerce.order.fulfillmentStatus'),
      type: 'select',
      placeholder: t('commerce.order.fulfillmentStatusPlaceholder'),
      options: createOptions([
        'PENDING_PAYMENT',
        'AWAITING_ACCEPTANCE',
        'ACCEPTED',
        'PREPARING',
        'DELIVERING',
        'COMPLETED',
        'CANCELED',
      ] as FulfillmentStatus[], fulfillmentStatusLabelMap, t),
    },
    {
      prop: 'refundStatus',
      label: t('commerce.order.refundStatus'),
      type: 'select',
      placeholder: t('commerce.order.refundStatusPlaceholder'),
      options: createOptions(['NONE', 'REQUESTED', 'APPROVED', 'REJECTED'] as RefundStatus[], refundStatusLabelMap, t),
    },
  ] satisfies ConfigFormField[]
}

export function createOrderTableColumns(t: Translate) {
  return [
    {
      prop: 'orderNo',
      label: t('commerce.order.orderNo'),
      minWidth: 190,
    },
    {
      prop: 'shopName',
      label: t('commerce.order.restaurant'),
      minWidth: 160,
    },
    {
      prop: 'userId',
      label: t('commerce.order.userId'),
      width: 110,
    },
    {
      label: t('commerce.order.amount'),
      width: 110,
      formatter: row => `¥${Number(row.payableAmount || 0).toFixed(2)}`,
    },
    {
      label: t('commerce.order.paymentStatus'),
      width: 110,
      tag: row => ({
        label: t(paymentStatusLabelMap[row.status] || row.status),
        type: getPaymentStatusType(row.status),
      }),
    },
    {
      label: t('commerce.order.fulfillmentStatus'),
      width: 130,
      tag: row => ({
        label: t(fulfillmentStatusLabelMap[row.fulfillmentStatus]),
        type: getFulfillmentStatusType(row.fulfillmentStatus),
      }),
    },
    {
      label: t('commerce.order.refundStatus'),
      width: 120,
      tag: row => ({
        label: t(refundStatusLabelMap[row.refundStatus]),
        type: getRefundStatusType(row.refundStatus),
      }),
    },
    {
      prop: 'tradeNo',
      label: t('commerce.order.tradeNo'),
      minWidth: 210,
    },
    {
      prop: 'totalQty',
      label: t('commerce.order.totalQty'),
      width: 110,
    },
    {
      prop: 'tradeStatus',
      label: t('commerce.order.tradeStatus'),
      minWidth: 150,
    },
    {
      label: t('commerce.order.paidAt'),
      minWidth: 180,
      formatter: row => row.paidAt ? formatDateTime(row.paidAt) : '-',
    },
    {
      label: t('commerce.order.createdAt'),
      minWidth: 180,
      formatter: row => formatDateTime(row.createdAt),
    },
  ] satisfies ConfigTableColumn<OrderItem>[]
}

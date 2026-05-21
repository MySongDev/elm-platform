/**
 * @file 订单管理组合式状态
 * @domain features/order-management
 * @description 聚合订单列表查询、状态表单和状态标签映射，是订单管理页面的业务状态边界。
 */

import type { OrderItem } from '@/entities/order'
import { getCommerceOrders, updateCommerceOrder } from '@/entities/order'
import { createElementPlusCrudFeedback, useConfigCrud } from '@/shared/config-crud'

export interface OrderQuery {
  orderNo: string
  status: '' | OrderItem['status']
}

export interface OrderStatusFormState {
  status: OrderItem['status']
  _orderId?: number
}

/**
 * @description 将订单业务状态映射为 Element Plus 标签类型；未知状态按待处理警告态展示。
 * @param status 订单状态。
 * @returns Element Plus tag type。
 */
export function getOrderStatusType(status: OrderItem['status']) {
  if (status === 'paid')
    return 'success'
  if (status === 'closed')
    return 'info'
  return 'warning'
}

/**
 * @description 有副作用：调用订单接口，维护订单列表和状态表单，并通过 CRUD feedback 触发保存提示。
 * @returns 订单管理页面使用的列表状态、查询状态和状态更新操作。
 */
export function useOrderManagement() {
  const { t } = useI18n()

  const crud = useConfigCrud<OrderItem, OrderQuery, OrderStatusFormState, Partial<OrderItem>, number>({
    getDefaultQuery: () => ({ orderNo: '', status: '' as OrderQuery['status'] }),
    getDefaultForm: () => ({ status: 'pending' }),
    fetchList: () => getCommerceOrders(),
    createItem: async () => { /* order creation not supported */ },
    updateItem: async (id, payload) => {
      await updateCommerceOrder(id, payload)
    },
    deleteItem: async () => { /* order deletion not supported */ },
    getFormId: form => form._orderId ?? 0,
    getRowId: row => row.id,
    filterItem: (item, query) => {
      const orderNoMatched = !query.orderNo || item.orderNo.includes(query.orderNo)
      const statusMatched = !query.status || item.status === query.status
      return orderNoMatched && statusMatched
    },
    toForm: row => ({
      status: row.status,
      _orderId: row.id,
    }),
    toPayload: form => ({ status: form.status }),
    deleteConfirm: () => '',
    saveSuccessMessage: t('commerce.saveSuccess'),
    feedback: createElementPlusCrudFeedback(),
  })

  return {
    loading: crud.loading,
    saving: crud.saving,
    dialogVisible: crud.dialogVisible,
    statusForm: crud.form,
    query: crud.query,
    filteredData: crud.filteredData,
    resetQuery: crud.resetQuery,
    openStatusDialog: crud.openEditDialog,
    fetchRows: crud.fetchRows,
    submitStatus: crud.submitForm,
  }
}

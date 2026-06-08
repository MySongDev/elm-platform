import type { AdminOrderAction, OrderItem } from '@/entities/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCommerceOrderDetail,
  getCommerceOrders,
  runCommerceOrderAction,
} from '@/entities/order'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'
import { orderActionConfig } from '../config/workflow'

export interface OrderQuery extends Record<string, unknown> {
  orderNo: string
  status: '' | OrderItem['status']
  fulfillmentStatus: '' | OrderItem['fulfillmentStatus']
  refundStatus: '' | OrderItem['refundStatus']
}

export function useOrderManagement() {
  const { t } = useI18n()
  const detailVisible = ref(false)
  const rejectVisible = ref(false)
  const detailLoading = ref(false)
  const actionSaving = ref(false)
  const selectedOrder = shallowRef<OrderItem | null>(null)
  const rejectOrder = shallowRef<OrderItem | null>(null)

  const table = useReadonlyTable<OrderItem, OrderQuery>({
    queryDefaults: {
      orderNo: '',
      status: '',
      fulfillmentStatus: '',
      refundStatus: '',
    },
    fetchApi: () => getCommerceOrders(),
    filter: (data, query) => data.filter((item) => {
      const orderNoMatched = !query.orderNo || item.orderNo.includes(query.orderNo)
      const statusMatched = !query.status || item.status === query.status
      const fulfillmentMatched = !query.fulfillmentStatus || item.fulfillmentStatus === query.fulfillmentStatus
      const refundMatched = !query.refundStatus || item.refundStatus === query.refundStatus
      return orderNoMatched && statusMatched && fulfillmentMatched && refundMatched
    }),
  })

  async function openDetail(row: OrderItem) {
    detailVisible.value = true
    detailLoading.value = true
    try {
      selectedOrder.value = await getCommerceOrderDetail(row.orderNo)
    }
    finally {
      detailLoading.value = false
    }
  }

  async function executeAction(action: AdminOrderAction, row: OrderItem) {
    if (action === 'REJECT_REFUND') {
      rejectOrder.value = row
      rejectVisible.value = true
      return
    }

    const config = orderActionConfig[action]
    await ElMessageBox.confirm(t(config.confirmText!), t('common.tip'), {
      type: config.danger ? 'warning' : 'info',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
    })

    actionSaving.value = true
    try {
      await runCommerceOrderAction(row.orderNo, action)
      ElMessage.success(t('commerce.order.actionSuccess'))
      await table.fetchRows()
      if (selectedOrder.value?.orderNo === row.orderNo) {
        selectedOrder.value = await getCommerceOrderDetail(row.orderNo)
      }
    }
    catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t('commerce.order.conflictMessage'))
    }
    finally {
      actionSaving.value = false
    }
  }

  async function submitReject(reason: string) {
    if (!rejectOrder.value)
      return

    actionSaving.value = true
    try {
      await runCommerceOrderAction(rejectOrder.value.orderNo, 'REJECT_REFUND', { reason })
      ElMessage.success(t('commerce.order.actionSuccess'))
      rejectVisible.value = false
      rejectOrder.value = null
      await table.fetchRows()
    }
    catch (error) {
      ElMessage.error(error instanceof Error ? error.message : t('commerce.order.conflictMessage'))
    }
    finally {
      actionSaving.value = false
    }
  }

  return {
    loading: table.loading,
    query: table.query,
    filteredData: table.filteredData,
    resetQuery: table.resetQuery,
    fetchRows: table.fetchRows,
    detailVisible,
    rejectVisible,
    detailLoading,
    actionSaving,
    selectedOrder,
    rejectOrder,
    openDetail,
    executeAction,
    submitReject,
  }
}

import type { OrderItem } from '@/entities/order'
import { getCommerceOrders } from '@/entities/order'
import { useReadonlyTable } from '@/shared/lib/useReadonlyTable'

export interface OrderQuery extends Record<string, unknown> {
  orderNo: string
  status: '' | OrderItem['status']
}

export function getOrderStatusType(status: OrderItem['status']) {
  if (status === 'PAID')
    return 'success'
  if (status === 'CLOSED')
    return 'info'
  if (status === 'PENDING')
    return 'warning'
  return 'info'
}

export function useOrderManagement() {
  const table = useReadonlyTable<OrderItem, OrderQuery>({
    queryDefaults: {
      orderNo: '',
      status: '',
    },
    fetchApi: () => getCommerceOrders(),
    filter: (data, query) => data.filter((item) => {
      const orderNoMatched = !query.orderNo || item.orderNo.includes(query.orderNo)
      const statusMatched = !query.status || item.status === query.status
      return orderNoMatched && statusMatched
    }),
  })

  return {
    loading: table.loading,
    query: table.query,
    filteredData: table.filteredData,
    resetQuery: table.resetQuery,
    fetchRows: table.fetchRows,
  }
}

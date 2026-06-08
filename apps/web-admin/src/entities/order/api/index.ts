import type { paths } from '@elm-platform/api-types'
import type { AdminOrderAction, OrderItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

type ApiEnvelopeData<T> = T extends { data: infer Data } ? Data : never
type AdminOrderDetailOperation = paths['/api/admin/commerce/orders/{orderNo}']['get']
type AdminOrderDetailResponseBody = AdminOrderDetailOperation['responses'][200]['content']['application/json']

export type AdminOrderDetailResult = ApiEnvelopeData<AdminOrderDetailResponseBody>

export function getCommerceOrders() {
  return request.get<OrderItem[]>(adminEndpoints.commerce.orders)
}

export function getCommerceOrderDetail(orderNo: string) {
  return request.get<AdminOrderDetailResult>(adminEndpoints.commerce.orderDetail(orderNo))
}

export function runCommerceOrderAction(orderNo: string, action: AdminOrderAction, payload: Record<string, unknown> = {}) {
  const endpointMap: Record<AdminOrderAction, string> = {
    ACCEPT: adminEndpoints.commerce.orderAccept(orderNo),
    START_PREPARING: adminEndpoints.commerce.orderStartPreparing(orderNo),
    START_DELIVERY: adminEndpoints.commerce.orderStartDelivery(orderNo),
    COMPLETE: adminEndpoints.commerce.orderComplete(orderNo),
    APPROVE_REFUND: adminEndpoints.commerce.orderRefundApprove(orderNo),
    REJECT_REFUND: adminEndpoints.commerce.orderRefundReject(orderNo),
  }

  return request.post<OrderItem>(endpointMap[action], payload)
}

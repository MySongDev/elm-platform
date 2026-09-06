import type { AdminOrderAction, OrderItem } from '../model'
import type { ApiResponseData } from '@/shared/api/openapi'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export type AdminOrderDetailResult = ApiResponseData<'/api/admin/commerce/orders/{orderNo}', 'get'>

// 订单列表接口的响应数据(已剥信封),来自后端 OpenAPI 自动生成的契约。
export type AdminOrderListResult = ApiResponseData<'/api/admin/commerce/orders', 'get'>
type AdminOrderListItem = AdminOrderListResult[number]

// 编译期漂移守卫:后端契约里订单列表的每个字段,都必须在手写富类型 OrderItem 中存在。
// 后端一旦给列表新增/改名字段而 OrderItem 未跟进(且重新生成过类型),_Assert 的类型参数会变成 false,
// 违反 `extends true` 约束而编译报错,逼开发者对齐 OrderItem —— 这就是订单列表这一环的契约闭环。
// 说明:只校验字段是否齐全,不校验枚举收窄(OrderItem 用 contracts 强枚举、生成类型是宽松 string,
// 那是刻意的精度提升,不算漂移)。
type _Assert<T extends true> = T
export type OrderListContractGuard = _Assert<
  [Exclude<keyof AdminOrderListItem, keyof OrderItem>] extends [never] ? true : false
>

export function getCommerceOrders() {
  // 运行时仍返回富类型 OrderItem[](UI 依赖其 contracts 强枚举);
  // 与后端契约的一致性由上面的 _assertOrderItemCoversContract 在编译期保证。
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

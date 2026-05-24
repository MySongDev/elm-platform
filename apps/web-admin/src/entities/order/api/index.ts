import type { OrderItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export function getCommerceOrders() {
  return request.get<OrderItem[]>(adminEndpoints.commerce.orders)
}

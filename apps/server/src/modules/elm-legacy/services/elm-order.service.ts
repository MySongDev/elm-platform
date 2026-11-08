import type { OrderRecord } from '../types/demo-order.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { seedOrders } from '../data/demo-order.seed'

/**
 * 旧 `/bos/orders*` 的内存演示订单，**不是** `payment_orders` 的真实订单。
 * 不要与 modules/order 的 OrderQueryService/OrderWorkflowService 合并（016 §3.1）。
 */
@Injectable()
export class ElmOrderService {
  private readonly orders = [...seedOrders]

  listOrders() {
    return this.orders
  }

  countOrders() {
    return this.orders.length
  }

  updateOrder(id: number, data: Partial<OrderRecord>) {
    const index = this.orders.findIndex(item => item.id === id)
    if (index < 0)
      throw new NotFoundException('订单不存在')
    this.orders[index] = {
      ...this.orders[index],
      status: data.status || this.orders[index].status,
    }
    return this.orders[index]
  }
}

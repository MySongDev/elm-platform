import type { OrderRecord } from '../types/elm.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { ElmStoreService } from './elm-store.service'

@Injectable()
export class ElmOrderService {
  constructor(private readonly store: ElmStoreService) {}

  listOrders() {
    return this.store.orders
  }

  countOrders() {
    return this.store.orders.length
  }

  updateOrder(id: number, data: Partial<OrderRecord>) {
    const index = this.store.orders.findIndex(item => item.id === id)
    if (index < 0)
      throw new NotFoundException('订单不存在')

    this.store.orders[index] = {
      ...this.store.orders[index],
      status: data.status || this.store.orders[index].status,
    }
    return this.store.orders[index]
  }
}

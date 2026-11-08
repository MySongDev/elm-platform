import type { OrderRecord } from '../types/demo-order.types'

/** 订单 mock 数据。真实订单在 `payment_orders` 表，这里只服务内存态的演示接口。 */
export const seedOrders: OrderRecord[] = [
  {
    id: 1,
    orderNo: 'ELM202605170001',
    userId: 1,
    restaurantId: 1,
    restaurantName: '鲜花蛋糕旗舰店',
    amount: 168,
    status: 'paid',
    createdAt: new Date().toISOString(),
  },
]

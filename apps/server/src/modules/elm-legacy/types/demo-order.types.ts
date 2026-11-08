export type OrderStatus = 'pending' | 'paid' | 'closed'

export interface OrderRecord {
  id: number
  orderNo: string
  userId: number
  restaurantId: number
  restaurantName: string
  amount: number
  status: OrderStatus
  createdAt: string
}

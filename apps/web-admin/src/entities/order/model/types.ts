export interface OrderItem {
  id: number
  orderNo: string
  userId: number
  restaurantId: number
  restaurantName: string
  amount: number
  status: 'pending' | 'paid' | 'closed'
  createdAt: string
}

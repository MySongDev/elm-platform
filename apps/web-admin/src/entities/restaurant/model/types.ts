export interface RestaurantItem {
  id: number
  name: string
  address: string
  phone: string
  category: string
  image_path: string
  rating: number
  recent_order_num: number
  float_minimum_order_amount: number
  float_delivery_fee: number
  distance: string
  order_lead_time: string
  description: string
  createdAt: string
}

export type RestaurantPayload = Partial<RestaurantItem>

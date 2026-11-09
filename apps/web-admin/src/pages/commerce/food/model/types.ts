export interface FoodItem {
  _id: string
  item_id: number
  restaurant_id: number
  category_id: number
  name: string
  image_path: string
  description: string
  month_sales: number
  satisfy_rate: number
  rating: number
  specfoods: Array<{
    price: number
    packing_fee: number
    original_price: number
  }>
  createdAt: string
}

export type FoodPayload = Partial<FoodItem>

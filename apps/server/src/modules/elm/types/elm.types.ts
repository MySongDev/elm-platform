export interface CityRecord {
  id: number;
  name: string;
  abbr: string;
  area_code: string;
  sort: number;
  latitude: number;
  longitude: number;
  geohash: string;
  is_map: boolean;
  pinyin: string;
}

export interface ActivityRecord {
  id: number;
  _id: string;
  icon_name: string;
  name: string;
  description: string;
  icon_color: string;
}

export interface SupportRecord {
  id: number;
  _id: string;
  icon_name: string;
  name: string;
  description: string;
  icon_color: string;
}

export interface RestaurantRecord {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location: number[];
  phone: string;
  category: string;
  supports: SupportRecord[];
  status: number;
  recent_order_num: number;
  rating_count: number;
  rating: number;
  promotion_info: string;
  piecewise_agent_fee: { tips: string };
  opening_hours: string[];
  license: {
    catering_service_license_image: string;
    business_license_image: string;
  };
  is_new: boolean;
  is_premium: boolean;
  image_path: string;
  identification: Record<string, string | null>;
  float_minimum_order_amount: number;
  float_delivery_fee: number;
  distance: string;
  order_lead_time: string;
  description: string;
  delivery_mode: {
    color: string;
    id: number;
    is_solid: boolean;
    text: string;
  };
  activities: ActivityRecord[];
  createdAt: string;
}

export interface FoodRecord {
  _id: string;
  item_id: number;
  category_id: number;
  restaurant_id: number;
  name: string;
  image_path: string;
  description: string;
  tips: string;
  month_sales: number;
  satisfy_rate: number;
  satisfy_count: number;
  rating_count: number;
  rating: number;
  activity: {
    image_text_color: string;
    icon_color: string;
    image_text: string;
  };
  attributes: Array<{ icon_color: string; icon_name: string }>;
  specifications: Array<{ name: string; values: string[] }>;
  specfoods: Array<{
    specs_name: string;
    name: string;
    item_id: number;
    sku_id: number;
    food_id: number;
    restaurant_id: number;
    _id: string;
    specs: Array<{ name: string; value: string }>;
    stock: number;
    checkout_mode: number;
    is_essential: boolean;
    recent_popularity: number;
    sold_out: boolean;
    price: number;
    promotion_stock: number;
    recent_rating: number;
    packing_fee: number;
    pinyin_name: string;
    original_price: number;
  }>;
  createdAt: string;
}

export interface MenuCategoryRecord {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  type: number;
  icon_url: string;
  is_selected: boolean;
  foods: FoodRecord[];
}

export type MenuCategorySeed = Omit<MenuCategoryRecord, 'foods'>;

export interface AddressRecord {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  phone_bk: string;
  address: string;
  address_detail: string;
  geohash: string;
  sex: number;
  tag: string;
  tag_type: number;
  poi_type: number;
}

export interface ElmUserRecord {
  user_id: number;
  id: number;
  username: string;
  mobile: string;
  email: string;
  avatar: string;
  balance: number;
  gift_amount: number;
  point: number;
  city: string;
  registe_time: string;
  is_active: number;
}

export type OrderStatus = 'pending' | 'paid' | 'closed';

export interface OrderRecord {
  id: number;
  orderNo: string;
  userId: number;
  restaurantId: number;
  restaurantName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface RestaurantSeedInput {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  category: string;
  image_path: string;
  rating: number;
  recent_order_num: number;
  distance: string;
  order_lead_time: string;
  description: string;
}

export interface RestaurantListQuery {
  offset?: unknown;
  limit?: unknown;
  keyword?: unknown;
  restaurant_category_id?: unknown;
  restaurant_category_ids?: unknown;
}

export interface FoodListQuery {
  offset?: unknown;
  limit?: unknown;
  restaurant_id?: unknown;
  keyword?: unknown;
}

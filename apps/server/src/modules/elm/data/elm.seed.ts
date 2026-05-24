import type {
  AddressRecord,
  CityRecord,
  ElmUserRecord,
  FoodRecord,
  MenuCategorySeed,
  OrderRecord,
  RestaurantRecord,
} from '../types/elm.types'
import { createCity, createFood, createRestaurant, nowIso } from '../factories/elm.factories'

export const seedCities: CityRecord[] = [
  createCity(1, '上海', 'SH', '021', 31.23037, 121.473701, 'shanghai', 1),
  createCity(2, '北京', 'BJ', '010', 39.9042, 116.407396, 'beijing', 2),
  createCity(3, '杭州', 'HZ', '0571', 30.27415, 120.15515, 'hangzhou', 3),
  createCity(4, '深圳', 'SZ', '0755', 22.543099, 114.057868, 'shenzhen', 4),
  createCity(5, '广州', 'GZ', '020', 23.12911, 113.264385, 'guangzhou', 5),
  createCity(6, '南京', 'NJ', '025', 32.060255, 118.796877, 'nanjing', 6),
]

export const seedUsers: ElmUserRecord[] = [
  {
    user_id: 1,
    id: 1,
    username: 'elm_user',
    mobile: '13800138000',
    email: 'user@example.com',
    avatar: 'default.jpg',
    balance: 128,
    gift_amount: 3,
    point: 520,
    city: '上海',
    registe_time: '2026-05-17 12:00',
    is_active: 1,
  },
]

export const seedRestaurants: RestaurantRecord[] = [
  createRestaurant({
    id: 1,
    name: '鲜花蛋糕旗舰店',
    address: '上海市黄浦区人民大道 100 号',
    latitude: 31.22967,
    longitude: 121.4762,
    phone: '021-10000001',
    category: '鲜花蛋糕/蛋糕',
    image_path: 'shop/15c1513a00615.jpg',
    rating: 4.8,
    recent_order_num: 1288,
    distance: '1.2公里',
    order_lead_time: '32分钟',
    description: '鲜花与蛋糕一起送达',
  }),
  createRestaurant({
    id: 2,
    name: '肯德基精选店',
    address: '上海市浦东新区世纪大道 88 号',
    latitude: 31.234,
    longitude: 121.51,
    phone: '021-10000002',
    category: '快餐便当/简餐',
    image_path: 'shop/15c19349ebe12.jpg',
    rating: 4.6,
    recent_order_num: 2340,
    distance: '2.5公里',
    order_lead_time: '28分钟',
    description: '经典炸鸡汉堡套餐',
  }),
  createRestaurant({
    id: 3,
    name: '轻食沙拉研究所',
    address: '上海市静安区南京西路 666 号',
    latitude: 31.226,
    longitude: 121.459,
    phone: '021-10000003',
    category: '简餐/轻食',
    image_path: 'shop/187bcca1ec6114376.jpg',
    rating: 4.7,
    recent_order_num: 875,
    distance: '3.1公里',
    order_lead_time: '35分钟',
    description: '低脂轻食和鲜榨果汁',
  }),
]

export const seedMenuCategories: MenuCategorySeed[] = [
  { id: 1, restaurant_id: 1, name: '热销榜', description: '大家喜欢吃，才叫真好吃。', type: 1, icon_url: '', is_selected: true },
  { id: 2, restaurant_id: 1, name: '蛋糕甜品', description: '生日与下午茶精选', type: 2, icon_url: '', is_selected: false },
  { id: 3, restaurant_id: 2, name: '人气套餐', description: '多人套餐更划算', type: 1, icon_url: '', is_selected: true },
  { id: 4, restaurant_id: 2, name: '小食饮品', description: '炸物和饮品', type: 2, icon_url: '', is_selected: false },
  { id: 5, restaurant_id: 3, name: '轻食沙拉', description: '高蛋白低负担', type: 1, icon_url: '', is_selected: true },
]

export const seedFoods: FoodRecord[] = [
  createFood(1, 1, 1, '玫瑰草莓蛋糕', 68, 'food/15c545e4a705.png', '玫瑰香气与草莓夹心'),
  createFood(1, 2, 2, '向日葵花束', 99, 'food/15c545e4a705.png', '明亮花束，适合纪念日'),
  createFood(2, 3, 3, '经典香辣鸡腿堡套餐', 39, 'food/15c545e4a705.png', '汉堡、薯条、可乐'),
  createFood(2, 4, 4, '黄金鸡块', 18, 'food/15c545e4a705.png', '外脆里嫩小食'),
  createFood(3, 5, 5, '牛油果鸡胸沙拉', 42, 'food/15c545e4a705.png', '高蛋白轻食'),
]

export const seedAddresses: AddressRecord[] = [
  {
    id: 1001,
    user_id: 1,
    name: '宋明旺',
    phone: '13800138000',
    phone_bk: '',
    address: '上海人民广场',
    address_detail: '1 号楼 101',
    geohash: '31.22967,121.4762',
    sex: 1,
    tag: '家',
    tag_type: 2,
    poi_type: 0,
  },
]

export const seedOrders: OrderRecord[] = [
  {
    id: 1,
    orderNo: 'ELM202605170001',
    userId: 1,
    restaurantId: 1,
    restaurantName: '鲜花蛋糕旗舰店',
    amount: 168,
    status: 'paid',
    createdAt: nowIso(),
  },
]

import type {
  CityRecord,
  OrderRecord,
} from '../../elm-catalog/types/elm-catalog.types'
import { createCity, nowIso } from '../../elm-catalog/factories/elm.factories'

/**
 * 内存 seed 数据 —— 2026-09-30 商家数据本地化后只保留**尚未入库**的两部分。
 *
 * 已移除（原先在这里，现在有真库表）：
 * ・seedRestaurants / seedMenuCategories / seedFoods
 *   → `restaurants` / `food_categories` / `foods` 三张表，由
 *     `pnpm --filter @elm-platform/server run elm:import` 从上游导入。
 *     留在这里会成为与数据库并存的第四份数据源。
 *
 * 背景与依据：docs/engineering/008-merchant-data-localization.md
 */

export const seedCities: CityRecord[] = [
  createCity(1, '上海', 'SH', '021', 31.23037, 121.473701, 'shanghai', 1),
  createCity(2, '北京', 'BJ', '010', 39.9042, 116.407396, 'beijing', 2),
  createCity(3, '杭州', 'HZ', '0571', 30.27415, 120.15515, 'hangzhou', 3),
  createCity(4, '深圳', 'SZ', '0755', 22.543099, 114.057868, 'shenzhen', 4),
  createCity(5, '广州', 'GZ', '020', 23.12911, 113.264385, 'guangzhou', 5),
  createCity(6, '南京', 'NJ', '025', 32.060255, 118.796877, 'nanjing', 6),
]

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
    createdAt: nowIso(),
  },
]

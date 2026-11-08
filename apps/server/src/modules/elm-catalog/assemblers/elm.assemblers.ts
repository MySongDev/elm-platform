import type { CategoryEntry, Food, Restaurant } from '../../../generated/prisma/client'

/**
 * 装配层：把 Prisma 行还原成上游 elm.cangdu.org 的响应形状。
 *
 * 为什么必须有这一层：Prisma 的 `@map` 只改**数据库列名**，不改 Prisma 字段名，
 * 所以 `row.recentOrderNum` 这个驼峰字段必须显式映射回上游的 `recent_order_num`。
 * 直接 `{ ...row }` 会让所有下划线字段全写错，而且类型系统抓不到
 * （这 4 个接口的响应是 rawResponse 直出，没有 OpenAPI schema 兜底）。
 *
 * 刻意不返回的字段见 docs/engineering/008-merchant-data-localization.md §8.3。
 */

/** 请求方的坐标，来自 query 的 latitude/longitude。可能缺失（游客模式）或非数字。 */
export interface RequestCoords {
  latitude?: unknown
  longitude?: unknown
}

/** 上游对 distance 一律返回这个常量（实测 4298 条全为 "10公里"），用作坐标缺失时的兜底。 */
const UPSTREAM_DISTANCE_FALLBACK = '10公里'

const EARTH_RADIUS_KM = 6371
const toRad = (deg: number) => (deg * Math.PI) / 180

/** 球面距离（公里）。数据量在万级以内，逐个精算比预筛 + 索引更简单。 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

function toFinite(value: unknown): number | null {
  if (value === null || value === undefined || value === '')
    return null
  const result = Number(value)
  return Number.isFinite(result) ? result : null
}

/**
 * 只对本页要返回的行算距离（方案①，见 008 §8.2）：
 * 排序仍复刻上游的 id 升序，距离只作为展示值 —— 所以每页只算 20 次，
 * SQL 层没有任何额外成本，也不需要地理索引。
 */
function formatDistance(row: Pick<Restaurant, 'latitude' | 'longitude'>, coords?: RequestCoords) {
  const lat = toFinite(coords?.latitude)
  const lng = toFinite(coords?.longitude)
  if (lat === null || lng === null)
    return UPSTREAM_DISTANCE_FALLBACK

  const km = haversineKm(lat, lng, row.latitude, row.longitude)
  return km < 1 ? `${Math.round(km * 1000)}米` : `${km.toFixed(1)}公里`
}

/** 商家行 → 上游 `/shopping/restaurants` 与 `/shopping/restaurant/:id` 的响应项。 */
export function toRestaurantResponse(row: Restaurant, coords?: RequestCoords) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    location: row.location,
    phone: row.phone,
    category: row.category,
    supports: row.supports,
    status: row.status,
    recent_order_num: row.recentOrderNum,
    rating_count: row.ratingCount,
    rating: row.rating,
    promotion_info: row.promotionInfo,
    piecewise_agent_fee: row.piecewiseAgentFee,
    opening_hours: row.openingHours,
    license: row.license,
    is_new: row.isNew,
    is_premium: row.isPremium,
    image_path: row.imagePath,
    identification: row.identification,
    float_minimum_order_amount: row.floatMinimumOrderAmount,
    float_delivery_fee: row.floatDeliveryFee,
    distance: formatDistance(row, coords),
    order_lead_time: row.orderLeadTime,
    description: row.description,
    // 上游有 224 条商家根本不含 delivery_mode 键，所以要「省略键」而不是给 null，
    // 否则 JSON.stringify 会多出一个 "delivery_mode":null。
    ...(row.deliveryMode === null ? {} : { delivery_mode: row.deliveryMode }),
    activities: row.activities,
  }
}

/**
 * 管理端 / 搜索接口用：在上游形状之上补本地字段。
 *
 * 为什么要分两个装配函数：`/shopping/restaurants` 必须与上游逐字段一致（不能多出本地键），
 * 而管理端的 `RestaurantItem`（apps/web-admin/src/entities/restaurant/model/types.ts）
 * 把 `createdAt` 声明为必填。两个消费方的形状诉求本来就不同，硬合成一个会两边都不对。
 */
export function toLocalRestaurantResponse(row: Restaurant, coords?: RequestCoords) {
  return {
    ...toRestaurantResponse(row, coords),
    createdAt: row.createdAt.toISOString(),
  }
}

/** 菜品行 → 上游菜单里 `foods[]` 的响应项。 */export function toFoodResponse(row: Food) {
  return {
    _id: row.mongoId,
    item_id: row.itemId,
    category_id: row.categoryId,
    restaurant_id: row.restaurantId,
    name: row.name,
    image_path: row.imagePath,
    description: row.description,
    tips: row.tips,
    month_sales: row.monthSales,
    satisfy_rate: row.satisfyRate,
    satisfy_count: row.satisfyCount,
    rating_count: row.ratingCount,
    rating: row.rating,
    activity: row.activity,
    attributes: row.attributes,
    specifications: row.specifications,
    specfoods: row.specfoods,
  }
}

/** 分类行 → 上游菜单里的分类项（不含 foods，由调用方拼装）。 */
export function toFoodCategoryResponse(row: {
  id: number
  restaurantId: number
  name: string
  description: string
  type: number
  iconUrl: string
  isSelected: boolean
}) {
  return {
    id: row.id,
    restaurant_id: row.restaurantId,
    name: row.name,
    description: row.description,
    type: row.type,
    icon_url: row.iconUrl,
    is_selected: row.isSelected,
  }
}

/** 分类入口行 → 上游 `/v2/index_entry` 的响应项。 */
export function toCategoryEntryResponse(row: CategoryEntry) {
  return {
    id: row.id,
    is_in_serving: row.isInServing,
    description: row.description,
    title: row.title,
    link: row.link,
    image_url: row.imageUrl,
    icon_url: row.iconUrl,
    title_color: row.titleColor,
  }
}

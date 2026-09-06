import { getImageUrl } from '@/config'

export interface SpecOption {
  value?: string
}

export interface Spec {
  sku_id?: string
  food_id?: string
  item_id?: string
  specs_name?: string
  specs?: SpecOption[]
  price?: number
  original_price?: number
}

export interface Food {
  item_id?: string
  _id?: string
  name?: string
  image_path?: string
  attributes?: Array<{ icon_name?: string }>
  specfoods?: Spec[]
}

/** 异构输入（后端返回/持久化读回），字段全部可选且类型未知 */
export interface ProductInput {
  id?: unknown
  productId?: unknown
  itemId?: unknown
  skuId?: unknown
  name?: unknown
  title?: unknown
  spec?: unknown
  image?: unknown
  price?: unknown
  unitPrice?: unknown
  originPrice?: unknown
  originalPrice?: unknown
  quantity?: unknown
  qty?: unknown
  selected?: unknown
  tag?: unknown
  specIndex?: unknown
  food?: Food | null
}

export interface CartProduct {
  id: string
  itemId: string
  skuId: string
  name: string
  spec: string
  image: string
  price: number
  originPrice: number
  quantity: number
  selected: boolean
  tag: string
  specIndex: number
  food: Food | null
}

export interface StoreInput {
  id?: unknown
  shopId?: unknown
  name?: unknown
  shopName?: unknown
  deliveryFee?: unknown
  minAmount?: unknown
  deliveryTime?: unknown
  distance?: unknown
  reserveText?: unknown
  deliveryText?: unknown
  products?: ProductInput[]
}

export interface CartStore {
  id: string
  name: string
  deliveryFee: number
  minAmount: number
  deliveryTime: string
  distance: string
  reserveText: string
  deliveryText: string
  products: CartProduct[]
}

/** 防御性字符串化：null/undefined 返回 fallback，避免页面出现 "null"/"undefined" */
export function toText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined)
    return fallback

  return String(value)
}

/** 防御性数字转换：非法输入返回 fallback，防止 NaN 污染价格/数量计算 */
export function toNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

/** 取指定索引的规格；越界/缺规格时兜底取第一个，无规格返回空对象 */
export function getCurrentSpec(food: Food, specIndex = 0): Spec {
  return food?.specfoods?.[specIndex] || food?.specfoods?.[0] || {}
}

/** 规格展示文案：优先后端给的整体名称 specs_name，否则拼接 specs[].value */
export function getSpecLabel(spec: Spec = {}): string {
  if (spec.specs_name)
    return spec.specs_name

  const labels = (spec.specs || [])
    .map(item => item?.value)
    .filter(Boolean)

  return labels.join(' / ')
}

/** 购物车条目唯一键（商家 + 菜品 + SKU）：同商品不同规格各自成条，便于同规格合并数量 */
export function createProductId(shopId: string, food: Food, specIndex = 0): string {
  const spec = getCurrentSpec(food, specIndex)
  const skuId = spec.sku_id || spec.food_id || spec.item_id || specIndex
  return `${shopId}-${food?.item_id || food?._id || food?.name}-${skuId}`
}

/** 把异构数据（后端返回/持久化读回）统一成购物车条目结构：字段兜底 + 数量下限 1 */
export function normalizeProduct(product: ProductInput = {}): CartProduct {
  const quantity = Math.max(1, toNumber(product.quantity ?? product.qty, 1))
  const price = toNumber(product.price ?? product.unitPrice, 0)

  return {
    id: toText(product.id || product.productId || product.itemId || product.skuId),
    itemId: toText(product.itemId || product.food?.item_id || product.id),
    skuId: toText(product.skuId || product.id),
    name: toText(product.name || product.title || product.food?.name, '商品'),
    spec: toText(product.spec),
    image: toText(product.image || getImageUrl(product.food?.image_path)),
    price,
    originPrice: toNumber(product.originPrice || product.originalPrice, 0),
    quantity,
    selected: Boolean(product.selected),
    tag: toText(product.tag),
    specIndex: toNumber(product.specIndex, 0),
    food: product.food || null,
  }
}

/** 商家级规范化：统一商家字段，过滤无效商品（缺 id 或价格 <= 0 视为脏数据） */
export function normalizeStore(store: StoreInput = {}): CartStore {
  const id = toText(store.id || store.shopId)
  const products = Array.isArray(store.products)
    ? store.products.map(normalizeProduct).filter(product => product.id && product.price > 0)
    : []

  return {
    id,
    name: toText(store.name || store.shopName, '当前商家'),
    deliveryFee: toNumber(store.deliveryFee, 0),
    minAmount: toNumber(store.minAmount, 20),
    deliveryTime: toText(store.deliveryTime),
    distance: toText(store.distance),
    reserveText: toText(store.reserveText),
    deliveryText: toText(store.deliveryText),
    products,
  }
}

/** 从菜品对象构造购物车条目：解析规格（价格/文案/缩略图），数量固定 1，选中态由调用方决定 */
export function productFromFood(shopId: string, food: Food, specIndex = 0, selected = false): CartProduct {
  const spec = getCurrentSpec(food, specIndex)
  const specLabel = getSpecLabel(spec)

  return normalizeProduct({
    id: createProductId(shopId, food, specIndex),
    itemId: food?.item_id || food?._id,
    skuId: spec.sku_id || spec.food_id || food?.item_id,
    name: food?.name,
    spec: specLabel ? `规格:${specLabel}` : '',
    image: getImageUrl(food?.image_path),
    price: spec.price,
    originPrice: spec.original_price,
    quantity: 1,
    selected,
    tag: food?.attributes?.[0]?.icon_name || '',
    specIndex,
    food,
  })
}

/** 持久化前的浅拷贝：防止序列化期间外部变异；food 保留引用（原始对象，不深拷贝） */
export function cloneStores(stores: CartStore[]): CartStore[] {
  return stores.map(store => ({
    ...store,
    products: store.products.map(product => ({ ...product })),
  }))
}

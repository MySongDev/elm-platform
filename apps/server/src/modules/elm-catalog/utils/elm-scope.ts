import type { TenantResourceFilter } from '../../tenant/tenant.types'

/**
 * 把 `TenantResourceFilter.shopId` 归一成数字 id 数组。
 *
 * ⚠️ 它有两种形态：标量 `string`，或 `{ in: string[] }` —— 而
 * `TenantAccessService.buildResourceWhere` 在 `dataScope: 'SHOP'` 下返回的**正是后者**。
 * 把它当标量 `Number(shopId)` 会得到 `NaN`，归一化后变成空数组，
 * 结果是 SHOP 作用域的账号一条数据都看不到（静默失效，不报错）。
 *
 * 另外 `boundShopIds` 存的是**商家的 id 字符串**，所以这里的产物能直接用于
 * `Restaurant.id` / `Food.restaurantId` 的 `in` 过滤。
 */
export function toShopIdList(shopId: TenantResourceFilter['shopId']): number[] {
  if (shopId === undefined)
    return []

  const raw = Array.isArray((shopId as { in?: unknown }).in)
    ? (shopId as { in: unknown[] }).in
    : [shopId]

  return raw
    .map(item => Number(item))
    .filter(item => Number.isFinite(item))
}

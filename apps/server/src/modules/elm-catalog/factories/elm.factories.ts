/**
 * 剩余的工厂函数。
 *
 * 2026-09-30 商家数据本地化时删掉了三个已无调用方的工厂：
 * ・`createRestaurant` / `createFood` —— 原先只服务内存 seed，现已由
 *   `restaurants` / `foods` 表取代（默认值逻辑搬进了 ElmRestaurantService.createRestaurant
 *   与 ElmFoodService.createFood，因为它们要产出 Prisma 的 create input，而不是响应对象）。
 * ・`createEntry` —— 原先只服务 ElmCityService.getIndexEntries() 那 8 条硬编码数据，
 *   该方法本身没有任何调用方，已整块删除，改读 `category_entries` 表。
 *
 * 城市与订单 mock（`createCity` / `nowIso`）已随 016 §3.1 拆分搬去
 * `modules/elm-location/data/city.seed.ts` 与 `modules/elm-legacy/data/demo-order.seed.ts`。
 */

export function createRestaurantCategory(id: number, name: string, subNames: string[]) {
  return {
    count: 3,
    id,
    image_url: '0e07558e305abfb2618ae760142222f9png',
    level: 1,
    name,
    sub_categories: subNames.map((subName, index) => ({
      count: 3 + index,
      id: id + index,
      image_url: '3edf3f4ef8ed1d300896c5b9178685ebpng',
      level: index === 0 ? 1 : 2,
      name: subName,
      _id: `category-${id}-${index}`,
    })),
  }
}

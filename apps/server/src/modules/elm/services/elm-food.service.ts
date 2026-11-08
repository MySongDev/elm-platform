import type { Prisma } from '../../../generated/prisma/client'
import type { TenantContext } from '../../tenant/tenant.types'
import type { FoodListQuery } from '../types/elm.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { TenantAccessService } from '../../tenant/tenant-access.service'
import {
  toFoodCategoryResponse,
  toFoodResponse,
} from '../assemblers/elm.assemblers'
import { toNumberValue, toStringValue } from '../utils/elm-query'
import { toShopIdList } from '../utils/elm-scope'
import { ElmRestaurantService } from './elm-restaurant.service'
import { ElmUpstreamImportService } from './elm-upstream-import.service'

/** 单页上限。 */
const MAX_PAGE_SIZE = 200

/**
 * 菜品/菜单服务。数据源是 `food_categories` + `foods` 两张表。
 *
 * 菜单走「预导 + 懒加载兜底」两条路：
 * ・全量预导：`elm:import -- --with-menus`（实测 4295 家里仅 149 家有菜单，合计约 2 MB）
 * ・懒加载：本文件的 `ensureMenuSynced`，用于兜底（例如上游将来新增了店铺）
 */
@Injectable()
export class ElmFoodService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
    private readonly restaurants: ElmRestaurantService,
    private readonly importer: ElmUpstreamImportService,
  ) {}

  // ---------------------------------------------------------------- 上游兼容

  /**
   * `/shopping/v2/menu?restaurant_id=`。
   *
   * 默认返回「分类数组 + 每类内嵌 foods」，保留与 `/shopping/getcategory/:id` 的兼容形状。
   * includeFoods=false 时仅返回分类元数据与 food_count，菜品由分类分页接口另取。
   */
  async getMenuForApi(restaurantId: number, includeFoods = true) {
    await this.ensureMenuSynced(restaurantId)

    // 点菜页只需分类导航。计数不读取 specfoods 等大 JSON 字段，不能先全量查出再删 foods。
    // 默认保留旧契约；新客户端显式传 include_foods=false，避免管理端/旧客户端被一起改坏。
    if (!includeFoods) {
      const categories = await this.prisma.foodCategory.findMany({
        where: { restaurantId },
        orderBy: { id: 'asc' },
        include: { _count: { select: { foods: true } } },
      })
      return categories.map(category => ({
        ...toFoodCategoryResponse(category),
        food_count: category._count.foods,
      }))
    }

    const categories = await this.prisma.foodCategory.findMany({
      where: { restaurantId },
      orderBy: { id: 'asc' },
      include: { foods: { orderBy: { itemId: 'asc' } } },
    })

    return categories.map(category => ({
      ...toFoodCategoryResponse(category),
      foods: category.foods.map(toFoodResponse),
    }))
  }

  /** `/shopping/getcategory/:restaurantId`：与菜单同源，只是外面套一层 `category_list`。 */
  async getFoodMenus(restaurantId: number, _context?: TenantContext) {
    return this.getMenuForApi(restaurantId)
  }

  /**
   * 分类内分页。分类必须属于请求的餐馆；仅按 categoryId 查会允许客户端混入别店菜品。
   * 多取一条判断 has_more，不用分类总数推断末页（总数可能在菜单编辑后变化）。
   * offset 分页适合一次点餐期间基本不变的菜单；并发删菜仍可能移动后续页的位置。
   */
  async getCategoryFoods(restaurantId: number, categoryId: number, offset: number, limit: number) {
    const category = await this.prisma.foodCategory.findFirst({
      where: {
        id: categoryId,
        restaurantId,
      },
      select: { id: true },
    })
    if (!category)
      throw new NotFoundException('食品种类不存在或不属于该餐馆')

    const rows = await this.prisma.food.findMany({
      where: {
        restaurantId,
        categoryId,
      },
      orderBy: { itemId: 'asc' },
      skip: offset,
      take: limit + 1,
    })
    const items = rows.slice(0, limit).map(toFoodResponse)
    const hasMore = rows.length > limit
    return {
      items,
      has_more: hasMore,
      next_offset: hasMore ? offset + items.length : null,
    }
  }

  /** `/shopping/v2/menu/:categoryId`。 */
  async getFoodCategoryDetail(categoryId: number, context?: TenantContext) {
    const category = await this.prisma.foodCategory.findFirst({
      where: {
        id: categoryId,
        ...(await this.buildCategoryScopeWhere(context)),
      },
    })
    if (!category)
      throw new NotFoundException('食品种类不存在')

    return toFoodCategoryResponse(category)
  }

  async listFoods(query: FoodListQuery = {}, context?: TenantContext) {
    const offset = toNumberValue(query.offset, 0)
    const limit = toNumberValue(query.limit, 20)
    const restaurantId = toNumberValue(query.restaurant_id, 0)
    const keyword = toStringValue(query.keyword).trim()

    if (restaurantId)
      await this.restaurants.getRestaurant(restaurantId, context)

    const rows = await this.prisma.food.findMany({
      where: {
        ...await this.buildFoodScopeWhere(context),
        ...(restaurantId ? { restaurantId } : {}),
        ...(keyword ? { name: { contains: keyword } } : {}),
      },
      orderBy: { itemId: 'asc' },
      skip: Math.max(offset, 0),
      take: Math.min(Math.max(limit, 1), MAX_PAGE_SIZE),
    })

    return rows.map(toFoodResponse)
  }

  async countFoods(context?: TenantContext) {
    return this.prisma.food.count({ where: await this.buildFoodScopeWhere(context) })
  }

  // ------------------------------------------------------------ 管理端 / 搜索

  async createFood(data: Partial<Record<string, unknown>>, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const restaurantId = toNumberValue(data.restaurant_id, 0)
    const restaurant = await this.restaurants.getRestaurant(restaurantId, context)
    const categoryId = await this.resolveCategoryId(restaurant.id, toNumberValue(data.category_id, 0))
    const itemId = await this.nextFoodItemId()
    const price = toNumberValue(asSpecPrice(data.specfoods), 20)

    const row = await this.prisma.food.create({
      data: {
        itemId,
        mongoId: `food-${itemId}`,
        categoryId,
        restaurantId: restaurant.id,
        name: toStringValue(data.name, '新食品'),
        imagePath: toStringValue(data.image_path, 'food/15c545e4a705.png'),
        description: toStringValue(data.description, ''),
        tips: '月售0份 好评率100%',
        monthSales: toNumberValue(data.month_sales, 0),
        satisfyRate: toNumberValue(data.satisfy_rate, 100),
        satisfyCount: toNumberValue(data.satisfy_count, 0),
        ratingCount: toNumberValue(data.rating_count, 0),
        rating: toNumberValue(data.rating, 5),
        specfoods: [{
          name: toStringValue(data.name, '新食品'),
          item_id: itemId,
          restaurant_id: restaurant.id,
          price,
        }],
        tenantId: context && context.dataScope !== 'ALL' ? context.tenantId : null,
      },
    })

    return toFoodResponse(row)
  }

  async updateFood(itemId: number, data: Partial<Record<string, unknown>>, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const current = await this.prisma.food.findFirst({
      where: {
        itemId,
        ...await this.buildFoodScopeWhere(context),
      },
    })
    if (!current)
      throw new NotFoundException('食品不存在')

    const monthSales = toNumberValue(data.month_sales, current.monthSales)
    const satisfyRate = toNumberValue(data.satisfy_rate, current.satisfyRate)
    const row = await this.prisma.food.update({
      where: { itemId },
      data: {
        ...buildUpdatableFoodFields(data),
        tips: `月售${monthSales}份 好评率${satisfyRate}%`,
      },
    })

    return toFoodResponse(row)
  }

  async deleteFood(itemId: number, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const row = await this.prisma.food.findFirst({
      where: {
        itemId,
        ...await this.buildFoodScopeWhere(context),
      },
    })
    if (row)
      await this.prisma.food.delete({ where: { itemId } })

    return {
      status: 1,
      success: '删除食品成功',
    }
  }

  // ------------------------------------------------------------------ 评价 mock

  getRatingTags() {
    return [
      {
        name: '全部',
        count: 128,
        unsatisfied: false,
      },
      {
        name: '满意',
        count: 118,
        unsatisfied: false,
      },
      {
        name: '有图',
        count: 36,
        unsatisfied: false,
      },
      {
        name: '不满意',
        count: 4,
        unsatisfied: true,
      },
    ]
  }

  /**
   * 评价列表。内容是 mock，但 `item_ratings[].food_name` 取自真实菜品 —— 原来读内存 seed，
   * 现在读库；该店无菜品时退化为占位名，避免出现空引用。
   */
  async getRatings(offset = 0, limit = 10, restaurantId?: number) {
    const foods = await this.prisma.food.findMany({
      where: restaurantId ? { restaurantId } : {},
      select: { name: true },
      orderBy: { itemId: 'asc' },
      take: 20,
    })
    const names = foods.length ? foods.map(food => food.name) : ['本店菜品']

    const list = Array.from({ length: 20 }, (_, index) => ({
      username: `用户${index + 1}`,
      rating_star: index % 5 === 0 ? 4 : 5,
      rated_at: '2026-05-17',
      time_spent_desc: '30分钟送达',
      rating_text: index % 4 === 0 ? '包装很好，味道也不错。' : '准时送达，整体满意。',
      item_ratings: [{ food_name: names[index % names.length] }],
      avatar: 'default.jpg',
    }))

    return list.slice(offset, offset + limit)
  }

  // ------------------------------------------------------------------- 内部

  /**
   * 确保该店菜单已从上游同步过。
   *
   * ⚠️ 判据用 `menuSyncedAt` 而不是"分类数是否为 0"：上游有大量商家的菜单本来就是 `[]`
   * （实测 13286 号店就是），用计数判断会让这些店**每次请求都回源一次**，成为永久热点。
   */
  private async ensureMenuSynced(restaurantId: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { menuSyncedAt: true },
    })
    if (!restaurant)
      throw new NotFoundException('餐馆不存在')

    if (restaurant.menuSyncedAt)
      return

    await this.importer.importMenu(restaurantId)
  }

  private async resolveCategoryId(restaurantId: number, requestedCategoryId: number) {
    const categories = await this.prisma.foodCategory.findMany({
      where: { restaurantId },
      orderBy: { id: 'asc' },
      select: { id: true },
    })

    if (requestedCategoryId && categories.some(item => item.id === requestedCategoryId))
      return requestedCategoryId
    if (categories.length)
      return categories[0].id

    const max = await this.prisma.foodCategory.aggregate({ _max: { id: true } })
    const created = await this.prisma.foodCategory.create({
      data: {
        id: (max._max.id ?? 0) + 1,
        restaurantId,
        name: '默认分类',
        type: 1,
        isSelected: true,
      },
    })
    return created.id
  }

  private async nextFoodItemId() {
    const max = await this.prisma.food.aggregate({ _max: { itemId: true } })
    return (max._max.itemId ?? 0) + 1
  }

  /** 菜品自身的租户/店铺作用域（与商家侧同构，见 ElmRestaurantService.buildScopeWhere）。 */
  private async buildFoodScopeWhere(context?: TenantContext): Promise<Prisma.FoodWhereInput> {
    if (!context)
      return {}

    this.tenantAccess.assertCanRead(context)
    const filter = this.tenantAccess.buildResourceWhere(context)
    const where: Prisma.FoodWhereInput = {}

    if (filter.tenantId !== undefined)
      where.tenantId = filter.tenantId

    if (filter.shopId !== undefined)
      where.restaurantId = { in: toShopIdList(filter.shopId) }

    return where
  }

  /** 分类的作用域要穿过所属商家，所以用 Prisma 的关系过滤表达。 */
  private buildCategoryScopeWhere(context?: TenantContext): Prisma.FoodCategoryWhereInput {
    if (!context)
      return {}

    this.tenantAccess.assertCanRead(context)
    const filter = this.tenantAccess.buildResourceWhere(context)
    const where: Prisma.FoodCategoryWhereInput = {}

    if (filter.tenantId !== undefined)
      where.restaurant = { tenantId: filter.tenantId }

    if (filter.shopId !== undefined)
      where.restaurantId = { in: toShopIdList(filter.shopId) }

    return where
  }
}

function asSpecPrice(specfoods: unknown): unknown {
  if (!Array.isArray(specfoods) || !specfoods.length)
    return undefined
  return (specfoods[0] as Record<string, unknown>)?.price
}

/** 管理端提交的是 snake_case payload，Prisma 列是驼峰，必须显式映射。 */
function buildUpdatableFoodFields(data: Partial<Record<string, unknown>>): Prisma.FoodUpdateInput {
  const result: Record<string, unknown> = {}

  if (data.name !== undefined)
    result.name = toStringValue(data.name)
  if (data.image_path !== undefined)
    result.imagePath = toStringValue(data.image_path)
  if (data.description !== undefined)
    result.description = toStringValue(data.description)
  if (data.month_sales !== undefined)
    result.monthSales = toNumberValue(data.month_sales)
  if (data.satisfy_rate !== undefined)
    result.satisfyRate = toNumberValue(data.satisfy_rate)
  if (data.satisfy_count !== undefined)
    result.satisfyCount = toNumberValue(data.satisfy_count)
  if (data.rating_count !== undefined)
    result.ratingCount = toNumberValue(data.rating_count)
  if (data.rating !== undefined)
    result.rating = toNumberValue(data.rating)
  if (data.restaurant_id !== undefined)
    result.restaurantId = toNumberValue(data.restaurant_id)
  if (data.category_id !== undefined)
    result.categoryId = toNumberValue(data.category_id)

  return result as Prisma.FoodUpdateInput
}

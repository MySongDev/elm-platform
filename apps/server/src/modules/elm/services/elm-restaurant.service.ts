import type { Prisma } from '../../../generated/prisma/client'
import type { TenantContext } from '../../tenant/tenant.types'
import type { RequestCoords } from '../assemblers/elm.assemblers'
import type { RestaurantListQuery } from '../types/elm.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { TenantAccessService } from '../../tenant/tenant-access.service'
import { toLocalRestaurantResponse, toRestaurantResponse } from '../assemblers/elm.assemblers'
import { toNumberValue, toStringValue } from '../utils/elm-query'
import { toShopIdList } from '../utils/elm-scope'

/** 单页上限，避免公共接口被 limit 拉爆。 */
const MAX_PAGE_SIZE = 200

/**
 * 商家服务。数据源是 `restaurants` 表（4295 行，从上游导入，见 008 §2）。
 *
 * 分成两组方法，因为两类消费方的形状诉求不同：
 * ・`*ForApi` —— 复刻上游 elm.cangdu.org 的响应形状，供 /shopping/* 兼容接口用
 * ・其余 —— 追加本地字段（createdAt）且走租户作用域，供管理端与 /v4/restaurants 用
 */
@Injectable()
export class ElmRestaurantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  // ---------------------------------------------------------------- 上游兼容

  /**
   * `/shopping/restaurants`。
   *
   * 排序复刻上游的 **id 升序**：实测上游完全忽略 latitude/longitude（北京坐标与广州坐标的
   * 响应逐字节相同），返回的是全中国混在一起的 id 升序，所以本地也只需要 ORDER BY id。
   * distance 只对本页算（方案①，见 008 §8.2）。
   */
  async listForApi(query: Record<string, unknown> = {}, coords?: RequestCoords) {
    const offset = toNumberValue(query.offset, 0)
    const limit = toNumberValue(query.limit, 20)

    const rows = await this.prisma.restaurant.findMany({
      orderBy: { id: 'asc' },
      skip: Math.max(offset, 0),
      take: Math.min(Math.max(limit, 1), MAX_PAGE_SIZE),
    })

    return rows.map(row => toRestaurantResponse(row, coords))
  }

  /** `/shopping/restaurant/:shopId`。实测上游的列表项与详情字段完全一致，故同一装配函数。 */
  async getByIdForApi(shopId: number) {
    const row = await this.prisma.restaurant.findUnique({ where: { id: shopId } })
    if (!row)
      throw new NotFoundException('餐馆不存在')

    return toRestaurantResponse(row)
  }

  /** `/shopping/restaurants/count` —— 与列表同源，不再出现"count 说 3 家、列表给 4295 家"。 */
  countForApi() {
    return this.prisma.restaurant.count()
  }

  // ------------------------------------------------------------ 管理端 / 搜索

  async listRestaurants(query: RestaurantListQuery = {}, context?: TenantContext) {
    const offset = toNumberValue(query.offset, 0)
    const limit = toNumberValue(query.limit, 20)
    const keyword = toStringValue(query.keyword).trim()

    const rows = await this.prisma.restaurant.findMany({
      where: {
        ...this.buildScopeWhere(context),
        ...(keyword
          ? { OR: [{ name: { contains: keyword } }, { category: { contains: keyword } }] }
          : {}),
      },
      orderBy: { id: 'asc' },
      skip: Math.max(offset, 0),
      take: Math.min(Math.max(limit, 1), MAX_PAGE_SIZE),
    })

    return rows.map(row => toLocalRestaurantResponse(row))
  }

  /** `/v4/restaurants`：搜索结果。`geohash` 解析出的坐标用于算 distance。 */
  async searchRestaurants(keyword: string, coords?: RequestCoords, context?: TenantContext) {
    const rows = await this.prisma.restaurant.findMany({
      where: {
        ...this.buildScopeWhere(context),
        ...(keyword ? { name: { contains: keyword } } : {}),
      },
      orderBy: { id: 'asc' },
      take: MAX_PAGE_SIZE,
    })

    return rows.map(row => toLocalRestaurantResponse(row, coords))
  }

  async countRestaurants(context?: TenantContext) {
    return this.prisma.restaurant.count({ where: this.buildScopeWhere(context) })
  }

  async getRestaurant(id: number, context?: TenantContext) {
    const row = await this.prisma.restaurant.findFirst({
      where: {
        id,
        ...this.buildScopeWhere(context),
      },
    })
    if (!row)
      throw new NotFoundException('餐馆不存在')

    return toLocalRestaurantResponse(row)
  }

  async createRestaurant(data: Partial<Record<string, unknown>>, context?: TenantContext) {
    if (context) {
      this.tenantAccess.assertCanWrite(context)
      if (context.dataScope === 'SHOP')
        this.tenantAccess.assertShopAllowed(context, null)
    }

    const latitude = toNumberValue(data.latitude, 31.22967)
    const longitude = toNumberValue(data.longitude, 121.4762)
    const deliveryFee = toNumberValue(data.float_delivery_fee, 5)

    const row = await this.prisma.restaurant.create({
      data: {
        // 上游最大 id 已到两万多，接在它后面分配，不会撞已有行。
        id: await this.nextRestaurantId(),
        name: toStringValue(data.name, '新餐馆'),
        address: toStringValue(data.address, '上海市黄浦区'),
        latitude,
        longitude,
        location: [longitude, latitude],
        phone: toStringValue(data.phone, '021-00000000'),
        category: toStringValue(data.category, '快餐便当/简餐'),
        imagePath: toStringValue(data.image_path, 'shop/15c1513a00615.jpg'),
        rating: toNumberValue(data.rating, 4.5),
        recentOrderNum: toNumberValue(data.recent_order_num, 0),
        ratingCount: toNumberValue(data.rating_count, 0),
        orderLeadTime: toStringValue(data.order_lead_time, '30分钟'),
        description: toStringValue(data.description, ''),
        openingHours: ['8:30/22:30'],
        floatDeliveryFee: deliveryFee,
        floatMinimumOrderAmount: toNumberValue(data.float_minimum_order_amount, 20),
        piecewiseAgentFee: { tips: `配送费约¥${deliveryFee}` },
        tenantId: context && context.dataScope !== 'ALL' ? context.tenantId : null,
        // 管理端创建的商家不是上游数据，标记出来，避免将来重新导入时被当成上游行覆盖。
        source: 'local',
      },
    })

    return toLocalRestaurantResponse(row)
  }

  async updateRestaurant(id: number, data: Partial<Record<string, unknown>>, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const current = await this.prisma.restaurant.findFirst({
      where: {
        id,
        ...this.buildScopeWhere(context),
      },
    })
    if (!current)
      throw new NotFoundException('餐馆不存在')

    const latitude = toNumberValue(data.latitude, current.latitude)
    const longitude = toNumberValue(data.longitude, current.longitude)
    const deliveryFee = toNumberValue(data.float_delivery_fee, current.floatDeliveryFee)

    const row = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...buildUpdatableFields(data),
        latitude,
        longitude,
        location: [longitude, latitude],
        floatDeliveryFee: deliveryFee,
        piecewiseAgentFee: { tips: `配送费约¥${deliveryFee}` },
      },
    })

    return toLocalRestaurantResponse(row)
  }

  async deleteRestaurant(id: number, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const row = await this.prisma.restaurant.findFirst({
      where: {
        id,
        ...this.buildScopeWhere(context),
      },
    })
    if (row)
      await this.prisma.restaurant.delete({ where: { id } })

    return {
      status: 1,
      success: '删除餐馆成功',
    }
  }

  private async nextRestaurantId() {
    const max = await this.prisma.restaurant.aggregate({ _max: { id: true } })
    return (max._max.id ?? 0) + 1
  }

  /**
   * 把租户上下文翻译成 Prisma 的 where 条件 —— 这是「保留管道」的落点（见 008 §8.1）。
   *
   * 当前所有商家的 tenantId 都是 null（平台自营），所以 TENANT/SHOP 作用域的账号会看到
   * 空列表。这是明确的现状而非遗漏：将来给商家填上租户归属，这里一行都不用改。
   *
   * ⚠️ 商家的 `shopId` 就是它自己的 `id`（users.boundShopIds 存的是商家 id 的字符串），
   * 所以 SHOP 作用域必须把 shopId 映射到 id 上，不能直接把 shopId 塞进 where。
   */
  private buildScopeWhere(context?: TenantContext): Prisma.RestaurantWhereInput {
    if (!context)
      return {}

    this.tenantAccess.assertCanRead(context)
    const filter = this.tenantAccess.buildResourceWhere(context)
    const where: Prisma.RestaurantWhereInput = {}

    if (filter.tenantId !== undefined)
      where.tenantId = filter.tenantId

    if (filter.shopId !== undefined)
      where.id = { in: toShopIdList(filter.shopId) }

    return where
  }
}

/**
 * 管理端提交的是**上游形状的 snake_case** payload（`RestaurantItem` 直接镜像响应字段），
 * 而 Prisma 列是驼峰 —— 直接展开 `...data` 会让所有下划线字段静默写不进去。
 * 所以这里显式白名单映射，只放开管理端允许改的字段。
 */
function buildUpdatableFields(data: Partial<Record<string, unknown>>): Prisma.RestaurantUpdateInput {
  const result: Record<string, unknown> = {}

  if (data.name !== undefined)
    result.name = toStringValue(data.name)
  if (data.address !== undefined)
    result.address = toStringValue(data.address)
  if (data.phone !== undefined)
    result.phone = toStringValue(data.phone)
  if (data.category !== undefined)
    result.category = toStringValue(data.category)
  if (data.image_path !== undefined)
    result.imagePath = toStringValue(data.image_path)
  if (data.rating !== undefined)
    result.rating = toNumberValue(data.rating)
  if (data.recent_order_num !== undefined)
    result.recentOrderNum = toNumberValue(data.recent_order_num)
  if (data.order_lead_time !== undefined)
    result.orderLeadTime = toStringValue(data.order_lead_time)
  if (data.description !== undefined)
    result.description = toStringValue(data.description)
  if (data.promotion_info !== undefined)
    result.promotionInfo = toStringValue(data.promotion_info)
  if (data.float_minimum_order_amount !== undefined)
    result.floatMinimumOrderAmount = toNumberValue(data.float_minimum_order_amount)
  if (Array.isArray(data.opening_hours))
    result.openingHours = data.opening_hours.map(String)

  return result as Prisma.RestaurantUpdateInput
}

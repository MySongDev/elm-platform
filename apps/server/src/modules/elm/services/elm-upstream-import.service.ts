import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '../../../generated/prisma/client'
import { PrismaService } from '../../../prisma/prisma.service'
import { ElmUpstreamService } from './elm-upstream.service'

/**
 * 上游数据导入器：把 elm.cangdu.org 的商家/分类/菜单写进本地库。
 *
 * 数据规模实测（2026-09-30，见 docs/engineering/008-merchant-data-localization.md §2）：
 * ・商家 4298 条 / 4295 个唯一 id、单条约 1.7 KB → 一次性全量导入
 * ・首页分类 16 条 → 一次性全量导入
 * ・菜单：**4295 家里仅 149 家（3.5%）有菜单**，合计 308 分类 / 1934 菜品 / 约 **2 MB**
 *   → `--with-menus` 一次性全量预导（约 80 秒）；同时保留按需懒加载作兜底
 */

/** 上游分页大小。实测 limit=1000 也可行（1.7 MB），但单次 payload 越大失败重试越贵。 */
const PAGE_SIZE = 200

/**
 * ⚠️ 上游对 latitude/longitude 的处理很反直觉：**必须传，但取值被完全忽略**。
 * 实测北京坐标与广州坐标的响应逐字节相同，4298 条的 distance 恒为 "10公里"，
 * 排序也永远是全中国混在一起的 id 升序。不传则返回
 * {"status":0,"type":"ERROR_PARAMS","message":"latitude参数错误"}。
 *
 * 所以这里传一组固定坐标，纯粹是为了绕过参数校验。
 */
const REQUIRED_BUT_IGNORED_COORDS = {
  latitude: 31.22967,
  longitude: 121.4762,
}

interface UpstreamRestaurant {
  id: number
  [key: string]: unknown
}

interface UpstreamFoodCategory {
  id: number
  restaurant_id?: unknown
  name?: unknown
  description?: unknown
  type?: unknown
  icon_url?: unknown
  is_selected?: unknown
  foods?: unknown
  [key: string]: unknown
}

interface UpstreamCategoryEntry {
  id: number
  [key: string]: unknown
}

function toFiniteNumber(value: unknown, fallback: number) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

function toStringSafe(value: unknown, fallback = '') {
  if (value === null || value === undefined)
    return fallback
  return String(value)
}

function toJsonArray(value: unknown): Prisma.InputJsonValue {
  return (Array.isArray(value) ? value : []) as Prisma.InputJsonValue
}

function toJsonObject(value: unknown): Prisma.InputJsonValue {
  return (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as Prisma.InputJsonValue
}

/**
 * 修正上游写反的经纬度。
 *
 * 实测 4298 条里有 21 条 latitude/longitude 互换（latitude 出现 113.13 这种物理上
 * 不可能的值），且它们的 location 也是同序反转的。地址文字能反证原值是错的
 * —— 例如 id=11949 的地址是"湖南省岳阳市岳阳楼区"，而岳阳在 29.36°N / 113.13°E，
 * 正好是它给出的两个值的交换。
 *
 * 这是**修正**而非偏离上游：不修的话这 21 家算出来的距离会是一千多公里。
 * 注意 location 必须跟着一起重算，否则会与新坐标自相矛盾。
 */
function normalizeCoords(rawLatitude: number, rawLongitude: number) {
  const swapped = Math.abs(rawLatitude) > 90 && Math.abs(rawLongitude) <= 90
  return swapped
    ? {
        latitude: rawLongitude,
        longitude: rawLatitude,
        swapped,
      }
    : {
        latitude: rawLatitude,
        longitude: rawLongitude,
        swapped,
      }
}

@Injectable()
export class ElmUpstreamImportService {
  private readonly logger = new Logger(ElmUpstreamImportService.name)

  constructor(
    private readonly upstream: ElmUpstreamService,
    private readonly prisma: PrismaService,
  ) {}

  /** 全量导入商家（4298 条 / 4295 个唯一 id）。按 id upsert，中断后重跑不会产生重复行。 */
  async importRestaurants() {
    const page = await this.fetchRestaurantPages()

    // ⚠️ 上游的 id 并不是唯一键：实测 id=4979 出现 3 次、id=20937 出现 2 次，
    // 而且同 id 的两条内容**不同**（是两个不同商家共用了一个 id，连评分和月售都不一样）。
    // upsert 按 id 收敛 → 后写入的那条胜出，其余变体丢失。
    // 这里显式告警，把静默的数据丢失变成可见的。
    const uniqueIds = new Set(page.map(row => row.id))
    if (uniqueIds.size !== page.length) {
      this.logger.warn(
        `上游返回 ${page.length} 条但只有 ${uniqueIds.size} 个唯一 id，`
        + `${page.length - uniqueIds.size} 条重复行会被 upsert 覆盖（上游 id 并非唯一键）`,
      )
    }

    let imported = 0

    for (let offset = 0; offset < page.length; offset += PAGE_SIZE) {
      const chunk = page.slice(offset, offset + PAGE_SIZE)
      const syncedAt = new Date()

      await this.prisma.$transaction(
        chunk.map(row => this.prisma.restaurant.upsert({
          where: { id: row.id },
          create: {
            ...this.toRestaurantRow(row),
            syncedAt,
          },
          update: {
            ...this.toRestaurantRow(row),
            syncedAt,
          },
        })),
      )

      imported += chunk.length
      this.logger.log(`已导入商家 ${imported}/${page.length}`)
    }

    return {
      total: page.length,
      imported,
      unique: uniqueIds.size,
    }
  }

  /** 全量导入首页分类入口（16 条）。sortOrder 固化上游的数组顺序。 */
  async importCategoryEntries() {
    const entries = await this.upstream.get<UpstreamCategoryEntry[]>('/v2/index_entry')
    const list = Array.isArray(entries) ? entries : []
    const syncedAt = new Date()

    await this.prisma.$transaction(
      list.map((entry, index) => this.prisma.categoryEntry.upsert({
        where: { id: entry.id },
        create: {
          ...this.toCategoryEntryRow(entry, index),
          syncedAt,
        },
        update: {
          ...this.toCategoryEntryRow(entry, index),
          syncedAt,
        },
      })),
    )

    return { total: list.length }
  }

  /**
   * 按需导入单个商家的菜单。
   *
   * 同时被两条路径复用：全量预导（`importAllMenus`）与首次访问时的懒加载兜底
   * （`ElmFoodService.ensureMenuSynced`）。
   *
   * 整段放进一个事务：否则中途失败会留下"分类已删、菜品只插了一半"的残局。
   */
  async importMenu(restaurantId: number) {
    const payload = await this.upstream.get<unknown>('/shopping/v2/menu', {
      restaurant_id: restaurantId,
    })
    const categories = Array.isArray(payload) ? payload as UpstreamFoodCategory[] : []
    const syncedAt = new Date()

    await this.prisma.$transaction(async (tx) => {
      // 全量替换：先清掉该店既有菜单，避免上游删掉的分类/菜品在本地残留。
      await tx.food.deleteMany({ where: { restaurantId } })
      await tx.foodCategory.deleteMany({ where: { restaurantId } })

      for (const category of categories) {
        const foods = Array.isArray(category.foods) ? category.foods : []
        const categoryId = toFiniteNumber(category.id, 0)

        await tx.foodCategory.create({
          data: {
            id: categoryId,
            restaurantId,
            name: toStringSafe(category.name),
            description: toStringSafe(category.description),
            type: toFiniteNumber(category.type, 0),
            iconUrl: toStringSafe(category.icon_url),
            isSelected: Boolean(category.is_selected),
            syncedAt,
          },
        })

        const foodRows = foods.map(food => this.toFoodRow(
          food as Record<string, unknown>,
          categoryId,
          restaurantId,
          syncedAt,
        ))
        for (let i = 0; i < foodRows.length; i += PAGE_SIZE)
          await tx.food.createMany({ data: foodRows.slice(i, i + PAGE_SIZE) })
      }

      // ⚠️ 必须记录同步时间：否则"上游该店本来就无菜单"会被反复当成"还没同步"，
      // 导致这家店每次请求都回源一次（见 009 阶段 5）。
      await tx.restaurant.update({
        where: { id: restaurantId },
        data: { menuSyncedAt: syncedAt },
      })
    }, { timeout: 120_000 })

    return {
      restaurantId,
      categories: categories.length,
    }
  }

  /**
   * 全量预导菜单：把所有**还没同步过**的商家的菜单一次性导入，用于彻底断掉上游依赖。
   *
   * 实测规模（2026-10-01，预导后直接查库）：4295 家里仅 **149 家（3.5%）** 有菜单，
   * 合计 308 分类 / 1934 菜品 / **约 2 MB**；全量跑一次 **约 80 秒、0 失败**。
   *
   * ⚠️ 这个数字被错估过两次（"上 GB"→"31 MB"），错因都是拿离群点主导的样本做线性外推 ——
   * 商家 1 一家就占全部菜品的 70%（1358/1934）。详见 008 §2.8。
   *
   * 为什么这样做而不是只靠懒加载：
   * ・懒加载（`ElmFoodService.ensureMenuSynced`）会让"从未访问过的商家"首次请求仍需上游，
   *   离线时那一条路径会 502
   * ・既然只有 2 MB，就没有理由保留这条外部依赖
   *
   * 两者不冲突：懒加载保留为**兜底**（上游将来新增店铺时仍能自愈），
   * 本方法按 `menu_synced_at IS NULL` 取待办，可重复执行、可中断续跑。
   */
  async importAllMenus(options: {
    concurrency?: number
    limit?: number
  } = {}) {
    const concurrency = options.concurrency ?? 4
    const pending = await this.prisma.restaurant.findMany({
      where: { menuSyncedAt: null },
      select: { id: true },
      orderBy: { id: 'asc' },
      ...(options.limit ? { take: options.limit } : {}),
    })

    if (!pending.length) {
      this.logger.log('所有商家的菜单都已同步，无需预导')
      return {
        total: 0,
        imported: 0,
        failed: 0,
        categories: 0,
        empty: 0,
      }
    }

    this.logger.log(`待预导菜单的商家 ${pending.length} 家，并发 ${concurrency}`)

    const result = {
      total: pending.length,
      imported: 0,
      failed: 0,
      categories: 0,
      empty: 0,
    }
    // 游标在单线程事件循环里自增，天然不会重复领取任务。
    let cursor = 0

    const worker = async () => {
      while (cursor < pending.length) {
        const current = pending[cursor++]
        try {
          const { categories } = await this.importMenu(current.id)
          result.imported++
          result.categories += categories
          if (categories === 0)
            result.empty++
        }
        catch (error) {
          // 单店失败不中断整批：记下来，末尾汇总，重跑会自然重试这一家
          result.failed++
          this.logger.warn(
            `商家 ${current.id} 菜单导入失败：${error instanceof Error ? error.message : String(error)}`,
          )
        }

        const done = result.imported + result.failed
        if (done % 200 === 0) {
          this.logger.log(
            `菜单预导进度 ${done}/${pending.length}（有菜单 ${result.imported - result.empty} 家，无菜单 ${result.empty} 家）`,
          )
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker))

    this.logger.log(
      `菜单预导完成：成功 ${result.imported}（其中无菜单 ${result.empty}）`
      + `失败 ${result.failed}，共 ${result.categories} 个分类`,
    )

    return result
  }

  private async fetchRestaurantPages() {
    const all: UpstreamRestaurant[] = []

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await this.upstream.get<unknown>('/shopping/restaurants', {
        ...REQUIRED_BUT_IGNORED_COORDS,
        offset,
        limit: PAGE_SIZE,
      })

      if (!Array.isArray(page) || page.length === 0)
        break

      all.push(...page as UpstreamRestaurant[])
      this.logger.log(`已抓取商家 ${all.length}`)
    }

    return all
  }

  private toRestaurantRow(row: UpstreamRestaurant) {
    const { latitude, longitude, swapped } = normalizeCoords(
      toFiniteNumber(row.latitude, 0),
      toFiniteNumber(row.longitude, 0),
    )

    return {
      id: row.id,
      name: toStringSafe(row.name),
      address: toStringSafe(row.address),
      latitude,
      longitude,
      // 上游偶有 location 与 latitude/longitude 不一致（实测 114 条，最远差 17.8 度）。
      // 前端不读 location，故原样存、原样吐，不做修正 —— 见 008 §2.6。
      // 例外：经纬度被修正的那 21 条必须一并重算 location，否则自相矛盾。
      location: swapped
        ? [longitude, latitude]
        : Array.isArray(row.location) && row.location.length === 2
          ? (row.location as number[]).map(item => toFiniteNumber(item, 0))
          : [longitude, latitude],
      phone: toStringSafe(row.phone),
      category: toStringSafe(row.category),
      status: toFiniteNumber(row.status, 1),
      recentOrderNum: toFiniteNumber(row.recent_order_num, 0),
      ratingCount: toFiniteNumber(row.rating_count, 0),
      rating: toFiniteNumber(row.rating, 0),
      promotionInfo: toStringSafe(row.promotion_info),
      openingHours: Array.isArray(row.opening_hours) ? (row.opening_hours as string[]).map(String) : [],
      isNew: Boolean(row.is_new),
      isPremium: Boolean(row.is_premium),
      imagePath: toStringSafe(row.image_path),
      floatMinimumOrderAmount: toFiniteNumber(row.float_minimum_order_amount, 0),
      floatDeliveryFee: toFiniteNumber(row.float_delivery_fee, 0),
      orderLeadTime: toStringSafe(row.order_lead_time),
      description: toStringSafe(row.description),
      supports: toJsonArray(row.supports),
      activities: toJsonArray(row.activities),
      piecewiseAgentFee: toJsonObject(row.piecewise_agent_fee),
      license: toJsonObject(row.license),
      identification: toJsonObject(row.identification),
      // 实测 4298 条里 224 条不含此键 → 存 NULL，出参时省略该键。
      // 可空 Json 列必须用 Prisma.DbNull 表达 SQL NULL（裸 null 会被当成 JSON 的 null）。
      deliveryMode: row.delivery_mode === undefined || row.delivery_mode === null
        ? Prisma.DbNull
        : toJsonObject(row.delivery_mode),
      // 平台自营：tenantId 留空。管道保留，将来做多租户只需填值（见 008 §8.1）。
      tenantId: null,
      source: 'upstream',
    }
  }

  private toFoodRow(
    food: Record<string, unknown>,
    categoryId: number,
    restaurantId: number,
    syncedAt: Date,
  ) {
    return {
      itemId: toFiniteNumber(food.item_id, 0),
      mongoId: toStringSafe(food._id),
      categoryId,
      restaurantId,
      name: toStringSafe(food.name),
      imagePath: toStringSafe(food.image_path),
      description: toStringSafe(food.description),
      tips: toStringSafe(food.tips),
      monthSales: toFiniteNumber(food.month_sales, 0),
      satisfyRate: toFiniteNumber(food.satisfy_rate, 0),
      satisfyCount: toFiniteNumber(food.satisfy_count, 0),
      ratingCount: toFiniteNumber(food.rating_count, 0),
      rating: toFiniteNumber(food.rating, 0),
      // 实测 190 个菜品里 71 个为 null → 可空 Json，同样要用 DbNull 表达 SQL NULL。
      activity: food.activity === undefined || food.activity === null
        ? Prisma.DbNull
        : toJsonObject(food.activity),
      attributes: toJsonArray(food.attributes),
      specifications: toJsonArray(food.specifications),
      specfoods: toJsonArray(food.specfoods),
      tenantId: null,
      syncedAt,
    }
  }

  private toCategoryEntryRow(entry: UpstreamCategoryEntry, index: number) {
    return {
      id: entry.id,
      title: toStringSafe(entry.title),
      description: toStringSafe(entry.description),
      isInServing: Boolean(entry.is_in_serving),
      link: toStringSafe(entry.link),
      imageUrl: toStringSafe(entry.image_url),
      iconUrl: toStringSafe(entry.icon_url),
      titleColor: toStringSafe(entry.title_color),
      sortOrder: index,
    }
  }
}

import type { TenantContext } from '@/modules/tenant/tenant.types'
import type { PrismaService } from '@/prisma/prisma.service'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ElmFoodService } from '@/modules/elm-catalog/services/elm-food.service'
import { ElmRestaurantService } from '@/modules/elm-catalog/services/elm-restaurant.service'
import { TenantAccessService } from '@/modules/tenant/tenant-access.service'

/**
 * 租户作用域测试。
 *
 * 2026-09-30 商家数据本地化后，两个服务从「内存 seed」改成「Prisma 读写」，
 * 构造依赖与返回值都变了，本文件随之重写（AI_TEST_POLICY 第 48 条：既有测试
 * 因改动失效时必须修复而不是跳过）。权限判定属该政策明确列出的必测场景。
 *
 * 两处刻意的口径变化：
 * ・原先按 `tenantCode` 匹配（内存数据没有外键），现在只按 `tenantId` 匹配 ——
 *   有了 `tenants` 外键后 tenantCode 是冗余的，作用域收敛到单一字段。
 * ・服务方法现在是异步的，断言改为 await / rejects。
 *
 * 这里的 Prisma 假实现会**真正执行 where 过滤**（而不是只记录参数），
 * 这样测试仍在验证"返回给调用方的数据被正确限定"，而不是"传了什么参数给谁"。
 */

type Row = Record<string, unknown>

/** 够用的 where 求值器：等值、{in}、{contains}、{OR}、以及一层关系过滤。 */
function matches(row: Row, where?: Record<string, unknown>): boolean {
  if (!where)
    return true

  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR')
      return (condition as Record<string, unknown>[]).some(sub => matches(row, sub))
    if (key === 'AND')
      return (condition as Record<string, unknown>[]).every(sub => matches(row, sub))

    const value = row[key]
    if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
      const nested = condition as Record<string, unknown>
      if ('in' in nested)
        return (nested.in as unknown[]).includes(value)
      if ('contains' in nested)
        return String(value).includes(String(nested.contains))
      return matches((value ?? {}) as Row, nested)
    }

    return value === condition
  })
}

function createModel(rows: Row[], defaults: Row) {
  const idOf = (where: Row) => where.id ?? where.itemId

  return {
    findMany: jest.fn(async (args: {
      where?: Record<string, unknown>
      skip?: number
      take?: number
    } = {}) => {
      const { where, skip = 0, take } = args
      const found = rows.filter(row => matches(row, where))
      return take === undefined ? found.slice(skip) : found.slice(skip, skip + take)
    }),
    findFirst: jest.fn(async (args: { where?: Record<string, unknown> } = {}) =>
      rows.find(row => matches(row, args.where)) ?? null),
    findUnique: jest.fn(async (args: { where?: Record<string, unknown> } = {}) =>
      rows.find(row => matches(row, args.where)) ?? null),
    count: jest.fn(async (args: { where?: Record<string, unknown> } = {}) =>
      rows.filter(row => matches(row, args.where)).length),
    aggregate: jest.fn(async (args: { _max?: Record<string, boolean> } = {}) => {
      const key = Object.keys(args._max ?? { id: true })[0]
      const values = rows.map(row => row[key]).filter((value): value is number => typeof value === 'number')
      return { _max: { [key]: values.length ? Math.max(...values) : null } }
    }),
    create: jest.fn(async (args: { data: Row }) => {
      const row = {
        ...defaults,
        ...args.data,
      }
      rows.push(row)
      return row
    }),
    update: jest.fn(async (args: {
      where: Row
      data: Row
    }) => {
      const row = rows.find(item => item.id === idOf(args.where) || item.itemId === idOf(args.where))
      if (!row)
        throw new Error('record not found')
      Object.assign(row, args.data)
      return row
    }),
    delete: jest.fn(async (args: { where: Row }) => {
      const index = rows.findIndex(item => item.id === idOf(args.where) || item.itemId === idOf(args.where))
      return rows.splice(index, 1)[0]
    }),
  }
}

function restaurantRow(overrides: Row): Row {
  return {
    id: 1,
    name: '店',
    address: '',
    latitude: 31,
    longitude: 121,
    location: [121, 31],
    phone: '',
    category: '',
    status: 1,
    recentOrderNum: 0,
    ratingCount: 0,
    rating: 4.5,
    promotionInfo: '',
    openingHours: [],
    isNew: false,
    isPremium: false,
    imagePath: '',
    floatMinimumOrderAmount: 0,
    floatDeliveryFee: 0,
    orderLeadTime: '',
    description: '',
    supports: [],
    activities: [],
    piecewiseAgentFee: {},
    license: {},
    identification: {},
    deliveryMode: null,
    tenantId: null,
    source: 'local',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function foodRow(overrides: Row): Row {
  return {
    itemId: 1,
    mongoId: 'food-1',
    categoryId: 1,
    restaurantId: 1,
    name: '菜',
    imagePath: '',
    description: '',
    tips: '',
    monthSales: 0,
    satisfyRate: 100,
    satisfyCount: 0,
    ratingCount: 0,
    rating: 5,
    activity: null,
    attributes: [],
    specifications: [],
    specfoods: [],
    tenantId: null,
    ...overrides,
  }
}

function context(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    userId: 1,
    username: 'tenant-admin',
    tenantId: 10,
    tenantCode: 'flower-cake',
    tenantName: '鲜花蛋糕',
    tenantStatus: 'ACTIVE',
    dataScope: 'TENANT',
    boundShopIds: [],
    isPlatformAdmin: false,
    ...overrides,
  }
}

function createServices() {
  const prisma = {
    restaurant: createModel([
      restaurantRow({
        id: 1,
        name: '花店',
        tenantId: 10,
      }),
      restaurantRow({
        id: 2,
        name: '别家店',
        tenantId: 20,
      }),
      restaurantRow({
        id: 3,
        name: '蛋糕店',
        tenantId: 10,
      }),
    ], restaurantRow({})),
    food: createModel([
      foodRow({
        itemId: 1,
        restaurantId: 1,
        tenantId: 10,
      }),
      foodRow({
        itemId: 2,
        restaurantId: 2,
        tenantId: 20,
      }),
      foodRow({
        itemId: 3,
        restaurantId: 1,
        tenantId: 10,
      }),
    ], foodRow({})),
    foodCategory: createModel([], {
      id: 900,
      restaurantId: 1,
      name: '默认分类',
      description: '',
      type: 1,
      iconUrl: '',
      isSelected: true,
    }),
  }

  const tenantAccess = new TenantAccessService()
  const restaurantService = new ElmRestaurantService(prisma as unknown as PrismaService, tenantAccess)
  const foodService = new ElmFoodService(
    prisma as unknown as PrismaService,
    tenantAccess,
    restaurantService,
    {} as never,
  )

  return {
    prisma,
    restaurantService,
    foodService,
  }
}

describe('elm tenant scoped database access', () => {
  it('limits tenant scoped reads to the caller tenant', async () => {
    const { restaurantService, foodService } = createServices()
    const tenant = context()

    const restaurants = await restaurantService.listRestaurants({ limit: 100 }, tenant)
    const foods = await foodService.listFoods({ limit: 100 }, tenant)

    expect(restaurants.map(item => item.id)).toEqual([1, 3])
    // 租户过滤体现在「返回哪些行」，而不体现在字段上：出参是上游形状，不含本地 tenantId。
    expect(restaurants[0]).not.toHaveProperty('tenantId')
    expect(foods.map(item => item.item_id)).toEqual([1, 3])
  })

  it('limits shop scoped operators to bound restaurant ids', async () => {
    const { restaurantService, foodService } = createServices()
    const shopOperator = context({
      dataScope: 'SHOP',
      boundShopIds: ['1'],
    })

    const restaurants = await restaurantService.listRestaurants({ limit: 100 }, shopOperator)
    const foods = await foodService.listFoods({ limit: 100 }, shopOperator)

    expect(restaurants.map(item => item.id)).toEqual([1])
    expect(foods.map(item => item.restaurant_id)).toEqual([1, 1])
  })

  it('assigns the current tenant when a tenant admin creates restaurants and foods', async () => {
    const { prisma, restaurantService, foodService } = createServices()
    const tenant = context()

    const restaurant = await restaurantService.createRestaurant({ name: '租户新店' }, tenant)
    const food = await foodService.createFood({
      restaurant_id: restaurant.id,
      name: '租户新品',
    }, tenant)

    // 断言写入参数而不是响应对象：出参是上游形状，本来就不含 tenantId（本地字段不外泄），
    // 所以"租户归属被正确赋值"这件事只能从落库参数上验证。
    expect(prisma.restaurant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '租户新店',
          tenantId: 10,
        }),
      }),
    )
    expect(prisma.food.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '租户新品',
          restaurantId: restaurant.id,
          tenantId: 10,
        }),
      }),
    )
    expect(food).toMatchObject({ restaurant_id: restaurant.id })
  })

  it('rejects shop scoped operators creating new restaurants', async () => {
    const { restaurantService } = createServices()
    const shopOperator = context({
      dataScope: 'SHOP',
      boundShopIds: ['1'],
    })

    await expect(restaurantService.createRestaurant({ name: '越权新店' }, shopOperator))
      .rejects
      .toThrow(ForbiddenException)
  })

  it('hides other tenants rows during mutation', async () => {
    const { restaurantService, foodService } = createServices()
    const tenant = context()

    await expect(restaurantService.updateRestaurant(2, { name: '越权改店' }, tenant))
      .rejects
      .toThrow(NotFoundException)
    await expect(foodService.updateFood(2, { name: '越权改菜' }, tenant))
      .rejects
      .toThrow(NotFoundException)
  })
})

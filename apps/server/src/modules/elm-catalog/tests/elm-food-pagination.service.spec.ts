import type { Food } from '@/generated/prisma/client'
import type { ElmRestaurantService } from '@/modules/elm-catalog/services/elm-restaurant.service'
import type { ElmUpstreamImportService } from '@/modules/elm-upstream/services/elm-upstream-import.service'
import type { TenantAccessService } from '@/modules/tenant/tenant-access.service'
import type { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException, ValidationPipe } from '@nestjs/common'
import { CategoryFoodsQueryDto } from '@/api/customer/food/dto/category-foods-query.dto'
import { ElmFoodService } from '@/modules/elm-catalog/services/elm-food.service'

// AI_TEST_POLICY §2：分类归属、末页判断和非法分页参数属于本次异步分页的关键边界。
function createService() {
  const foods = Array.from({ length: 41 }, (_, index) => ({
    itemId: index + 1,
    mongoId: `food-${index + 1}`,
    restaurantId: 42,
    categoryId: 7,
    name: `菜品${index + 1}`,
    specfoods: [],
  } as unknown as Food))
  const category = {
    id: 7,
    restaurantId: 42,
    name: '主食',
    description: '',
    type: 1,
    iconUrl: '',
    isSelected: true,
  }
  const prisma = {
    restaurant: { findUnique: jest.fn().mockResolvedValue({ menuSyncedAt: new Date() }) },
    foodCategory: {
      findFirst: jest.fn(async ({ where }) =>
        where.id === category.id && where.restaurantId === category.restaurantId ? category : null),
      findMany: jest.fn().mockResolvedValue([{
        ...category,
        _count: { foods: foods.length },
        foods,
      }]),
    },
    food: {
      findMany: jest.fn(async ({ where, skip, take }) => foods
        .filter(food => food.restaurantId === where.restaurantId && food.categoryId === where.categoryId)
        .sort((a, b) => a.itemId - b.itemId)
        .slice(skip, skip + take)),
    },
  }
  const importer = { importMenu: jest.fn() }
  const service = new ElmFoodService(
    prisma as unknown as PrismaService,
    {} as TenantAccessService,
    {} as ElmRestaurantService,
    importer as unknown as ElmUpstreamImportService,
  )
  return {
    service,
    prisma,
    importer,
  }
}

describe('分类菜单分页', () => {
  it('轻量菜单只读分类计数，不查询或返回菜品', async () => {
    const { service, prisma } = createService()
    const categories = await service.getMenuForApi(42, false)
    expect(categories).toEqual([expect.objectContaining({
      id: 7,
      food_count: 41,
    })])
    expect(categories[0]).not.toHaveProperty('foods')
    expect(prisma.foodCategory.findMany).toHaveBeenCalledWith({
      where: { restaurantId: 42 },
      orderBy: { id: 'asc' },
      include: { _count: { select: { foods: true } } },
    })
    expect(prisma.food.findMany).not.toHaveBeenCalled()
  })

  it('默认保留全量菜单兼容模式', async () => {
    const { service } = createService()
    const categories = await service.getMenuForApi(42)
    expect(categories[0]).toHaveProperty('foods')
  })

  it('按稳定顺序返回 20 / 20 / 1，末页不再给出下一页 offset', async () => {
    const { service } = createService()
    const first = await service.getCategoryFoods(42, 7, 0, 20)
    const second = await service.getCategoryFoods(42, 7, first.next_offset!, 20)
    const last = await service.getCategoryFoods(42, 7, second.next_offset!, 20)
    expect(first.items.map(food => food.item_id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    expect(second.items.map(food => food.item_id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 21))
    expect(last.items.map(food => food.item_id)).toEqual([41])
    expect(first.has_more).toBe(true)
    expect(second.has_more).toBe(true)
    expect(last.has_more).toBe(false)
    expect(last.next_offset).toBeNull()
  })

  it('恰好满页和空页都正确结束，不靠分类计数猜测', async () => {
    const { service } = createService()
    const full = await service.getCategoryFoods(42, 7, 21, 20)
    expect(full.items).toHaveLength(20)
    expect(full.has_more).toBe(false)
    const empty = await service.getCategoryFoods(42, 7, 41, 20)
    expect(empty).toEqual({
      items: [],
      has_more: false,
      next_offset: null,
    })
  })

  it('拒绝跨餐馆分类，且不查询菜品', async () => {
    const { service, prisma } = createService()
    await expect(service.getCategoryFoods(43, 7, 0, 20)).rejects.toThrow(NotFoundException)
    expect(prisma.food.findMany).not.toHaveBeenCalled()
  })
})

describe('分页参数 HTTP 验证', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  })
  const metadata = {
    type: 'query' as const,
    metatype: CategoryFoodsQueryDto,
  }

  it('转换查询字符串，并给出默认分页大小', async () => {
    await expect(pipe.transform({ restaurant_id: '42' }, metadata)).resolves.toMatchObject({
      restaurant_id: 42,
      offset: 0,
      limit: 20,
    })
  })

  it.each([
    { offset: -1 },
    { offset: 'NaN' },
    { limit: 0 },
    { limit: 51 },
    { limit: 1.5 },
    { restaurant_id: undefined },
  ])('拒绝非法分页参数 %j', async (invalid) => {
    await expect(pipe.transform({
      restaurant_id: '42',
      ...invalid,
    }, metadata)).rejects.toThrow()
  })
})

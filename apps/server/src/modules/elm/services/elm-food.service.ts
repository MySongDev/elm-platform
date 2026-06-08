import type { TenantContext } from '../../tenant/tenant.types'
import type { FoodListQuery, FoodRecord, RestaurantRecord } from '../types/elm.types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { TenantAccessService } from '../../tenant/tenant-access.service'
import { createFood } from '../factories/elm.factories'
import { nextNumberId, toNumberValue, toStringValue } from '../utils/elm-query'
import { ElmStoreService } from './elm-store.service'

@Injectable()
export class ElmFoodService {
  constructor(
    private readonly store: ElmStoreService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  getFoodMenus(restaurantId: number, context?: TenantContext) {
    this.assertRestaurantAllowed(restaurantId, context)

    return this.store.menuCategories
      .filter(category => category.restaurant_id === restaurantId)
      .map(category => ({
        ...category,
        foods: this.scopeFoods(context).filter(food => food.category_id === category.id),
      }))
  }

  getFoodCategoryDetail(categoryId: number, context?: TenantContext) {
    const category = this.store.menuCategories.find(item => item.id === categoryId)
    if (!category || !this.isRestaurantAllowed(category.restaurant_id, context))
      throw new NotFoundException('食品种类不存在')
    return category
  }

  listFoods(query: FoodListQuery = {}, context?: TenantContext) {
    const offset = toNumberValue(query.offset, 0)
    const limit = toNumberValue(query.limit, 20)
    const restaurantId = toNumberValue(query.restaurant_id, 0)
    const keyword = toStringValue(query.keyword).trim()

    let list = this.scopeFoods(context)
    if (restaurantId) {
      this.assertRestaurantAllowed(restaurantId, context)
      list = list.filter(item => item.restaurant_id === restaurantId)
    }
    if (keyword)
      list = list.filter(item => item.name.includes(keyword))
    return list.slice(offset, offset + limit)
  }

  countFoods(context?: TenantContext) {
    return this.scopeFoods(context).length
  }

  createFood(data: Partial<FoodRecord>, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const fallbackRestaurant = this.scopeRestaurants(context)[0]
    const restaurantId = toNumberValue(data.restaurant_id, fallbackRestaurant?.id)
    const restaurant = this.getRestaurantOrThrow(restaurantId, context)
    const categoryId = toNumberValue(data.category_id, 0)
    const category
      = this.store.menuCategories.find(item => item.id === categoryId && item.restaurant_id === restaurantId)
        || this.store.menuCategories.find(item => item.restaurant_id === restaurantId)
        || this.store.menuCategories[0]
    const itemId = nextNumberId(this.store.foods.map(item => item.item_id))
    const price = toNumberValue(data.specfoods?.[0]?.price, 20)
    const food = createFood(
      restaurantId,
      category.id,
      itemId,
      toStringValue(data.name, '新食品'),
      price,
      toStringValue(data.image_path, 'food/15c545e4a705.png'),
      toStringValue(data.description, ''),
      this.resolveCreateTenantFields(data, restaurant, context),
    )

    this.store.foods.unshift(food)
    return food
  }

  updateFood(itemId: number, data: Partial<FoodRecord>, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const index = this.store.foods.findIndex(item => item.item_id === itemId && this.isFoodAllowed(item, context))
    if (index < 0)
      throw new NotFoundException('食品不存在')

    const current = this.store.foods[index]
    const restaurantId = toNumberValue(data.restaurant_id, current.restaurant_id)
    const restaurant = this.getRestaurantOrThrow(restaurantId, context)
    const price = toNumberValue(data.specfoods?.[0]?.price, current.specfoods[0].price)
    const tenantFields = this.resolveUpdateTenantFields(current, data, restaurant, context)
    this.store.foods[index] = {
      ...current,
      ...data,
      item_id: itemId,
      restaurant_id: restaurantId,
      tips: `月售${toNumberValue(data.month_sales, current.month_sales)}份 好评率${toNumberValue(data.satisfy_rate, current.satisfy_rate)}%`,
      specfoods: current.specfoods.map(spec => ({
        ...spec,
        name: toStringValue(data.name, current.name),
        restaurant_id: restaurantId,
        price,
      })),
      ...tenantFields,
    }
    return this.store.foods[index]
  }

  deleteFood(itemId: number, context?: TenantContext) {
    if (context)
      this.tenantAccess.assertCanWrite(context)

    const foodIndex = this.store.foods.findIndex(item => item.item_id === itemId && this.isFoodAllowed(item, context))
    if (foodIndex >= 0) {
      this.store.foods.splice(foodIndex, 1)
    }

    return {
      status: 1,
      success: '删除食品成功',
    }
  }

  private scopeFoods(context?: TenantContext) {
    if (!context)
      return [...this.store.foods]

    this.tenantAccess.assertCanRead(context)
    return this.store.foods.filter(item => this.isFoodAllowed(item, context))
  }

  private scopeRestaurants(context?: TenantContext) {
    if (!context)
      return [...this.store.restaurants]

    this.tenantAccess.assertCanRead(context)
    return this.store.restaurants.filter(item => this.isRestaurantRecordAllowed(item, context))
  }

  private assertRestaurantAllowed(restaurantId: number, context?: TenantContext) {
    if (!this.isRestaurantAllowed(restaurantId, context))
      throw new NotFoundException('餐馆不存在')
  }

  private getRestaurantOrThrow(restaurantId: number, context?: TenantContext) {
    const restaurant = this.store.restaurants.find(item => item.id === restaurantId)
    if (!restaurant || !this.isRestaurantRecordAllowed(restaurant, context))
      throw new NotFoundException('餐馆不存在')
    return restaurant
  }

  private isRestaurantAllowed(restaurantId: number, context?: TenantContext) {
    const restaurant = this.store.restaurants.find(item => item.id === restaurantId)
    return Boolean(restaurant && this.isRestaurantRecordAllowed(restaurant, context))
  }

  private isRestaurantRecordAllowed(restaurant: RestaurantRecord, context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return true

    if (!this.matchesTenant(restaurant, context))
      return false

    if (context.dataScope === 'SHOP')
      return context.boundShopIds.includes(String(restaurant.id))

    return true
  }

  private isFoodAllowed(food: FoodRecord, context?: TenantContext) {
    if (!context || context.dataScope === 'ALL')
      return true

    if (!this.matchesTenant(food, context))
      return false

    if (context.dataScope === 'SHOP')
      return context.boundShopIds.includes(String(food.restaurant_id))

    return true
  }

  private matchesTenant(record: FoodRecord | RestaurantRecord, context: TenantContext) {
    const matchesTenantId = context.tenantId != null && record.tenantId != null && record.tenantId === context.tenantId
    const matchesTenantCode = Boolean(context.tenantCode && record.tenantCode && record.tenantCode === context.tenantCode)

    return matchesTenantId || matchesTenantCode
  }

  private resolveCreateTenantFields(
    data: Partial<FoodRecord>,
    restaurant: RestaurantRecord,
    context?: TenantContext,
  ) {
    if (!context || context.dataScope === 'ALL') {
      return {
        tenantId: data.tenantId ?? restaurant.tenantId ?? null,
        tenantCode: data.tenantCode ?? restaurant.tenantCode ?? null,
      }
    }

    return {
      tenantId: restaurant.tenantId ?? context.tenantId,
      tenantCode: restaurant.tenantCode ?? context.tenantCode,
    }
  }

  private resolveUpdateTenantFields(
    current: FoodRecord,
    data: Partial<FoodRecord>,
    restaurant: RestaurantRecord,
    context?: TenantContext,
  ) {
    if (!context || context.dataScope === 'ALL') {
      return {
        tenantId: data.tenantId ?? current.tenantId ?? restaurant.tenantId ?? null,
        tenantCode: data.tenantCode ?? current.tenantCode ?? restaurant.tenantCode ?? null,
      }
    }

    return {
      tenantId: current.tenantId ?? restaurant.tenantId ?? context.tenantId,
      tenantCode: current.tenantCode ?? restaurant.tenantCode ?? context.tenantCode,
    }
  }

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

  getRatings(offset = 0, limit = 10) {
    const list = Array.from({ length: 20 }, (_, index) => ({
      username: `用户${index + 1}`,
      rating_star: index % 5 === 0 ? 4 : 5,
      rated_at: '2026-05-17',
      time_spent_desc: '30分钟送达',
      rating_text: index % 4 === 0 ? '包装很好，味道也不错。' : '准时送达，整体满意。',
      item_ratings: [{ food_name: this.store.foods[index % this.store.foods.length].name }],
      avatar: 'default.jpg',
    }))
    return list.slice(offset, offset + limit)
  }
}

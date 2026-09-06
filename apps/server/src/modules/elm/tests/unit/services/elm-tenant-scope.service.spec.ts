import type { TenantContext } from '../../tenant/tenant.types'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { TenantAccessService } from '../../tenant/tenant-access.service'
import { ElmFoodService } from './elm-food.service'
import { ElmRestaurantService } from './elm-restaurant.service'
import { ElmStoreService } from './elm-store.service'

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
  const store = new ElmStoreService()
  const tenantAccess = new TenantAccessService()

  return {
    store,
    restaurantService: new ElmRestaurantService(store, tenantAccess),
    foodService: new ElmFoodService(store, tenantAccess),
  }
}

describe('elm tenant scoped in-memory data', () => {
  it('filters restaurants and foods by tenant code', () => {
    const {
      restaurantService,
      foodService,
    } = createServices()
    const tenant = context()

    expect(restaurantService.listRestaurants({ limit: 100 }, tenant).map(item => item.tenantCode)).toEqual([
      'flower-cake',
      'flower-cake',
    ])
    expect(foodService.listFoods({ limit: 100 }, tenant).map(item => item.tenantCode)).toEqual([
      'flower-cake',
      'flower-cake',
      'flower-cake',
    ])
  })

  it('limits shop scoped operators to bound restaurant ids', () => {
    const {
      restaurantService,
      foodService,
    } = createServices()
    const shopOperator = context({
      dataScope: 'SHOP',
      boundShopIds: ['1'],
    })

    expect(restaurantService.listRestaurants({ limit: 100 }, shopOperator).map(item => item.id)).toEqual([1])
    expect(foodService.listFoods({ limit: 100 }, shopOperator).map(item => item.restaurant_id)).toEqual([1, 1])
  })

  it('assigns current tenant when tenant admins create restaurants and foods', () => {
    const {
      restaurantService,
      foodService,
    } = createServices()
    const tenant = context()

    const restaurant = restaurantService.createRestaurant({
      name: '租户新店',
    }, tenant)
    const food = foodService.createFood({
      restaurant_id: restaurant.id,
      name: '租户新品',
    }, tenant)

    expect(restaurant).toMatchObject({
      tenantId: 10,
      tenantCode: 'flower-cake',
    })
    expect(food).toMatchObject({
      tenantId: 10,
      tenantCode: 'flower-cake',
      restaurant_id: restaurant.id,
    })
  })

  it('rejects shop scoped operators creating new restaurants', () => {
    const {
      restaurantService,
    } = createServices()
    const shopOperator = context({
      dataScope: 'SHOP',
      boundShopIds: ['1'],
    })

    expect(() => restaurantService.createRestaurant({
      name: '越权新店',
    }, shopOperator)).toThrow(ForbiddenException)
  })

  it('hides other tenant restaurants during mutation', () => {
    const {
      restaurantService,
      foodService,
    } = createServices()
    const tenant = context()

    expect(() => restaurantService.updateRestaurant(2, { name: '越权改店' }, tenant)).toThrow(NotFoundException)
    expect(() => foodService.updateFood(3, { name: '越权改菜' }, tenant)).toThrow(NotFoundException)
  })
})

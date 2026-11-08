import type { ElmFoodService } from '@/modules/elm-catalog/services/elm-food.service'
import type { ElmRestaurantService } from '@/modules/elm-catalog/services/elm-restaurant.service'
import type { ElmCityService } from '@/modules/elm/services/elm-city.service'
import { ElmFoodPublicController } from '@/api/customer/food/elm-food-public.controller'
import { ElmLocationController } from '@/api/customer/location/elm-location.controller'
import { ElmRestaurantPublicController } from '@/api/customer/restaurant/elm-restaurant-public.controller'

/**
 * 这 4 个接口原先是「转发上游」的薄代理，测试断言的是 `upstream.get` 被调用 ——
 * 那是在测实现细节（调了谁），而不是契约（返回什么）。
 *
 * 2026-09-30 本地化后它们改读本地库（见 docs/engineering/008-merchant-data-localization.md），
 * 于是重写为断言「控制器把请求委派给服务层、并把结果包进 rawResponse 信封」。
 * 顺带补上坐标透传的断言 —— 那是 distance 实时计算（方案①）的接线点，原先没有覆盖。
 */
describe('elm public controllers delegate to local services', () => {
  it('serves index entries from the local table', async () => {
    const payload = [{ id: 1 }]
    const cityService = {
      listCategoryEntries: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmLocationController(cityService as unknown as ElmCityService)

    const result = await controller.getIndexEntry()

    expect(cityService.listCategoryEntries).toHaveBeenCalled()
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })

  it('passes the query coordinates through so distance is computed against the caller', async () => {
    const payload = [{
      id: 42,
      distance: '1.2公里',
    }]
    const query = {
      latitude: '31.23',
      longitude: '121.47',
      offset: '0',
      limit: '20',
    }
    const restaurantService = {
      listForApi: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmRestaurantPublicController(
      {} as ElmCityService,
      restaurantService as unknown as ElmRestaurantService,
    )

    const result = await controller.getRestaurants(query)

    expect(restaurantService.listForApi).toHaveBeenCalledWith(query, {
      latitude: '31.23',
      longitude: '121.47',
    })
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })

  it('serves restaurant detail from the local table without touching the upstream proxy', async () => {
    const payload = {
      id: 42,
      name: 'local restaurant',
    }
    const restaurantService = {
      getByIdForApi: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmRestaurantPublicController(
      {} as ElmCityService,
      restaurantService as unknown as ElmRestaurantService,
    )

    const result = await controller.getRestaurant(42)

    expect(restaurantService.getByIdForApi).toHaveBeenCalledWith(42)
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })

  it('serves the menu from the local table', async () => {
    const payload = [{
      id: 7,
      name: 'local menu',
      foods: [],
    }]
    const foodService = {
      getMenuForApi: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmFoodPublicController(foodService as unknown as ElmFoodService)

    const result = await controller.getMenu(42)

    expect(foodService.getMenuForApi).toHaveBeenCalledWith(42)
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })
})

import type { ElmCityService } from '../services/elm-city.service'
import type { ElmFoodService } from '../services/elm-food.service'
import type { ElmRestaurantService } from '../services/elm-restaurant.service'
import type { ElmUpstreamService } from '../services/elm-upstream.service'
import { ElmFoodPublicController } from './elm-food-public.controller'
import { ElmLocationController } from './elm-location.controller'
import { ElmRestaurantPublicController } from './elm-restaurant-public.controller'

describe('elm upstream public controllers', () => {
  it('proxies index entries to the upstream service and awaits the payload', async () => {
    const payload = { entries: [{ id: 1 }] }
    const cityService = {
      getIndexEntries: jest.fn().mockReturnValue([{ id: 'local' }]),
    }
    const upstream = {
      get: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmLocationController(
      cityService as unknown as ElmCityService,
      upstream as unknown as ElmUpstreamService,
    )

    const result = await controller.getIndexEntry()

    expect(upstream.get).toHaveBeenCalledWith('/v2/index_entry')
    expect(cityService.getIndexEntries).not.toHaveBeenCalled()
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })

  it('proxies the complete restaurant query to the upstream service', async () => {
    const payload = [{
      id: 42,
      name: 'upstream restaurant',
    }]
    const query = {
      latitude: 31.23,
      longitude: 121.47,
      support_ids: [7, 9],
      keyword: '',
    }
    const cityService = {}
    const restaurantService = {
      listRestaurants: jest.fn().mockReturnValue([{ id: 'local' }]),
    }
    const upstream = {
      get: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmRestaurantPublicController(
      cityService as ElmCityService,
      restaurantService as unknown as ElmRestaurantService,
      upstream as unknown as ElmUpstreamService,
    )

    const result = await controller.getRestaurants(query)

    expect(upstream.get).toHaveBeenCalledWith('/shopping/restaurants', query)
    expect(restaurantService.listRestaurants).not.toHaveBeenCalled()
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })

  it('proxies restaurant detail without reading the local restaurant seed', async () => {
    const payload = {
      id: 42,
      name: 'upstream restaurant',
    }
    const restaurantService = {
      getRestaurant: jest.fn().mockReturnValue({
        id: 42,
        name: 'local',
      }),
    }
    const upstream = {
      get: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmRestaurantPublicController(
      {} as ElmCityService,
      restaurantService as unknown as ElmRestaurantService,
      upstream as unknown as ElmUpstreamService,
    )

    const result = await controller.getRestaurant(42)

    expect(upstream.get).toHaveBeenCalledWith('/shopping/restaurant/42')
    expect(restaurantService.getRestaurant).not.toHaveBeenCalled()
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })

  it('proxies restaurant menus without reading the local food seed', async () => {
    const payload = [{
      id: 7,
      name: 'upstream menu',
    }]
    const foodService = {
      getFoodMenus: jest.fn().mockReturnValue([{ id: 'local' }]),
    }
    const upstream = {
      get: jest.fn().mockResolvedValue(payload),
    }
    const controller = new ElmFoodPublicController(
      foodService as unknown as ElmFoodService,
      upstream as unknown as ElmUpstreamService,
    )

    const result = await controller.getMenu(42)

    expect(upstream.get).toHaveBeenCalledWith('/shopping/v2/menu', {
      restaurant_id: 42,
    })
    expect(foodService.getFoodMenus).not.toHaveBeenCalled()
    expect(result).toEqual({
      __rawResponse: true,
      payload,
    })
  })
})

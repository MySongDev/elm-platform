import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { parseGeoHash } from '../../../common/utils/query-values'
import { ElmRestaurantService } from '../../../modules/elm-catalog/services/elm-restaurant.service'
import { ElmCityService } from '../../../modules/elm/services/elm-city.service'

@ApiTags('消费者端－餐馆浏览')
@Controller()
export class ElmRestaurantPublicController {
  constructor(
    private readonly cityService: ElmCityService,
    private readonly restaurantService: ElmRestaurantService,
  ) {}

  @Get('shopping/restaurants')
  @ApiOperation({ summary: '获取商铺列表' })
  async getRestaurants(@Query() query: Record<string, unknown>) {
    // 排序在服务层复刻上游的 id 升序（实测上游完全忽略这两个坐标参数），
    // 它们唯一的用途是让 distance 显示真实值而不是上游那个恒定的 "10公里"。
    return rawResponse(await this.restaurantService.listForApi(query, {
      latitude: query.latitude,
      longitude: query.longitude,
    }))
  }

  @Get('shopping/restaurants/count')
  @ApiOperation({ summary: '获取餐馆数量' })
  async getRestaurantCount() {
    return rawResponse({
      status: 1,
      count: await this.restaurantService.countForApi(),
    })
  }

  @Get('v4/restaurants')
  @ApiOperation({ summary: '搜索餐馆' })
  async searchRestaurants(@Query() query: Record<string, unknown>) {
    const keyword = String(query.keyword ?? '')
    const [latitude, longitude] = parseGeoHash(String(query.geohash ?? ''))
    return rawResponse(await this.restaurantService.searchRestaurants(keyword, {
      latitude,
      longitude,
    }))
  }

  @Get('shopping/v2/restaurant/category')
  @ApiOperation({ summary: '商铺分类列表' })
  getRestaurantCategories() {
    return rawResponse(this.cityService.getRestaurantCategories())
  }

  @Get('shopping/v1/restaurants/delivery_modes')
  @ApiOperation({ summary: '配送方式列表' })
  getDeliveryModes() {
    return rawResponse(this.cityService.getDeliveryModes())
  }

  @Get('shopping/v1/restaurants/activity_attributes')
  @ApiOperation({ summary: '商家属性活动列表' })
  getActivityAttributes() {
    return rawResponse(this.cityService.getActivityAttributes())
  }

  @Get('shopping/restaurant/:shopId')
  @ApiOperation({ summary: '餐馆详情' })
  async getRestaurant(@Param('shopId', ParseIntPipe) shopId: number) {
    return rawResponse(await this.restaurantService.getByIdForApi(shopId))
  }
}

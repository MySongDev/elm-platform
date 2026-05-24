import type { ElmCityService } from '../services/elm-city.service'
import type { ElmRestaurantService } from '../services/elm-restaurant.service'
import type { RestaurantRecord } from '../types/elm.types'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'

@ApiTags('Elm 兼容接口 - 商家')
@Controller()
export class ElmRestaurantPublicController {
  constructor(
    private readonly cityService: ElmCityService,
    private readonly restaurantService: ElmRestaurantService,
  ) {}

  @Get('shopping/restaurants')
  @ApiOperation({ summary: '获取商铺列表' })
  getRestaurants(@Query() query: Record<string, unknown>) {
    return rawResponse(this.restaurantService.listRestaurants(query))
  }

  @Get('shopping/restaurants/count')
  @ApiOperation({ summary: '获取餐馆数量' })
  getRestaurantCount() {
    return rawResponse({ status: 1, count: this.restaurantService.countRestaurants() })
  }

  @Get('v4/restaurants')
  @ApiOperation({ summary: '搜索餐馆' })
  searchRestaurants(@Query('keyword') keyword = '') {
    return rawResponse(this.restaurantService.searchRestaurants(keyword))
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
  getRestaurant(@Param('shopId', ParseIntPipe) shopId: number) {
    return rawResponse(this.restaurantService.getRestaurant(shopId))
  }

  @Post('shopping/addshop')
  @ApiOperation({ summary: '添加餐馆' })
  addRestaurant(@Body() body: Partial<RestaurantRecord>) {
    this.restaurantService.createRestaurant(body)
    return rawResponse({ status: 1, success: '添加餐馆成功' })
  }

  @Post('shopping/updateshop')
  @ApiOperation({ summary: '更新餐馆' })
  updateRestaurant(@Body() body: Partial<RestaurantRecord> & { id?: number }) {
    if (body.id)
      this.restaurantService.updateRestaurant(body.id, body)
    return rawResponse({ status: 1, success: '修改商铺信息成功' })
  }

  @Delete('shopping/restaurant/:restaurantId')
  @ApiOperation({ summary: '删除餐馆' })
  deleteRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return rawResponse(this.restaurantService.deleteRestaurant(restaurantId))
  }
}

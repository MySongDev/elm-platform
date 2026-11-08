import type { RestaurantRecord } from '../../types/elm.types'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../../common/interceptors/transform.interceptor'
import { ElmCityService } from '../../services/elm-city.service'
import { ElmRestaurantService } from '../../services/elm-restaurant.service'
import { parseGeoHash } from '../../utils/elm-query'

/**
 * 商家公共接口。
 *
 * 2026-09-30 本地化：列表与详情原本转发上游 elm.cangdu.org，现改读 `restaurants` 表
 * （4295 行，由 `pnpm --filter @elm-platform/server run elm:import` 导入）。
 * 响应形状与上游保持一致，前端零改动 —— 依据见
 * docs/engineering/008-merchant-data-localization.md。
 */
@ApiTags('Elm 兼容接口 - 商家')
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

  @Post('shopping/addshop')
  @ApiOperation({ summary: '添加餐馆' })
  async addRestaurant(@Body() body: Partial<RestaurantRecord>) {
    await this.restaurantService.createRestaurant(body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '添加餐馆成功',
    })
  }

  @Post('shopping/updateshop')
  @ApiOperation({ summary: '更新餐馆' })
  async updateRestaurant(@Body() body: Partial<RestaurantRecord> & { id?: number }) {
    if (body.id)
      await this.restaurantService.updateRestaurant(body.id, body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '修改商铺信息成功',
    })
  }

  @Delete('shopping/restaurant/:restaurantId')
  @ApiOperation({ summary: '删除餐馆' })
  async deleteRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return rawResponse(await this.restaurantService.deleteRestaurant(restaurantId))
  }
}

import type { FoodRecord } from '../types/elm.types'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmFoodService } from '../services/elm-food.service'

/**
 * 商品公共接口。
 *
 * 2026-09-30 本地化：`/shopping/v2/menu` 原本转发上游，现读 `food_categories` + `foods`；
 * 菜单**按需导入**（首次访问某店时回源并落库），因为上游菜单稀疏且单店最大 1.5 MB。
 * 其余接口原本读进程内存 seed，现一并读库 —— 避免形成第二份数据源。
 */
@ApiTags('Elm 兼容接口 - 商品')
@Controller()
export class ElmFoodPublicController {
  constructor(private readonly foodService: ElmFoodService) {}

  @Get('shopping/v2/menu')
  @ApiOperation({ summary: '获取菜单列表' })
  async getMenu(@Query('restaurant_id', ParseIntPipe) restaurantId: number) {
    return rawResponse(await this.foodService.getMenuForApi(restaurantId))
  }

  @Get('shopping/getcategory/:restaurantId')
  @ApiOperation({ summary: '获取店铺食品种类' })
  async getFoodCategories(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return rawResponse({
      status: 1,
      category_list: await this.foodService.getFoodMenus(restaurantId),
    })
  }

  @Get('shopping/v2/menu/:categoryId')
  @ApiOperation({ summary: '获取食品种类详情' })
  async getFoodCategoryDetail(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return rawResponse(await this.foodService.getFoodCategoryDetail(categoryId))
  }

  @Get('shopping/v2/foods')
  @ApiOperation({ summary: '获取食品列表' })
  async getFoods(@Query() query: Record<string, unknown>) {
    return rawResponse(await this.foodService.listFoods(query))
  }

  @Get('shopping/v2/foods/count')
  @ApiOperation({ summary: '获取食品数量' })
  async getFoodCount() {
    return rawResponse({
      status: 1,
      count: await this.foodService.countFoods(),
    })
  }

  @Post('shopping/v2/addfood')
  @ApiOperation({ summary: '添加食品' })
  async addFood(@Body() body: Partial<FoodRecord>) {
    await this.foodService.createFood(body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '添加食品成功',
    })
  }

  @Post('shopping/v2/updatefood')
  @ApiOperation({ summary: '更新食品' })
  async updateFood(@Body() body: Partial<FoodRecord> & { item_id?: number }) {
    if (body.item_id)
      await this.foodService.updateFood(body.item_id, body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '修改食品信息成功',
    })
  }

  @Delete('shopping/v2/food/:foodId')
  @ApiOperation({ summary: '删除食品' })
  async deleteFood(@Param('foodId', ParseIntPipe) foodId: number) {
    return rawResponse(await this.foodService.deleteFood(foodId))
  }

  @Get('ugc/v2/restaurants/:restaurantId/ratings/tags')
  @ApiOperation({ summary: '评价分类' })
  getRatingTags(@Param('restaurantId', ParseIntPipe) _restaurantId: number) {
    return rawResponse(this.foodService.getRatingTags())
  }

  @Get('ugc/v2/restaurants/:restaurantId/ratings')
  @ApiOperation({ summary: '评价列表' })
  async getRatings(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('offset') offset = '0',
    @Query('limit') limit = '10',
  ) {
    return rawResponse(await this.foodService.getRatings(Number(offset), Number(limit), restaurantId))
  }
}

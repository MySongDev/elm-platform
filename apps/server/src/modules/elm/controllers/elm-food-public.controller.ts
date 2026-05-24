import type { ElmFoodService } from '../services/elm-food.service'
import type { FoodRecord } from '../types/elm.types'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'

@ApiTags('Elm 兼容接口 - 商品')
@Controller()
export class ElmFoodPublicController {
  constructor(private readonly foodService: ElmFoodService) {}

  @Get('shopping/v2/menu')
  @ApiOperation({ summary: '获取菜单列表' })
  getMenu(@Query('restaurant_id', ParseIntPipe) restaurantId: number) {
    return rawResponse(this.foodService.getFoodMenus(restaurantId))
  }

  @Get('shopping/getcategory/:restaurantId')
  @ApiOperation({ summary: '获取店铺食品种类' })
  getFoodCategories(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return rawResponse({
      status: 1,
      category_list: this.foodService.getFoodMenus(restaurantId),
    })
  }

  @Get('shopping/v2/menu/:categoryId')
  @ApiOperation({ summary: '获取食品种类详情' })
  getFoodCategoryDetail(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return rawResponse(this.foodService.getFoodCategoryDetail(categoryId))
  }

  @Get('shopping/v2/foods')
  @ApiOperation({ summary: '获取食品列表' })
  getFoods(@Query() query: Record<string, unknown>) {
    return rawResponse(this.foodService.listFoods(query))
  }

  @Get('shopping/v2/foods/count')
  @ApiOperation({ summary: '获取食品数量' })
  getFoodCount() {
    return rawResponse({ status: 1, count: this.foodService.countFoods() })
  }

  @Post('shopping/v2/addfood')
  @ApiOperation({ summary: '添加食品' })
  addFood(@Body() body: Partial<FoodRecord>) {
    this.foodService.createFood(body)
    return rawResponse({ status: 1, success: '添加食品成功' })
  }

  @Post('shopping/v2/updatefood')
  @ApiOperation({ summary: '更新食品' })
  updateFood(@Body() body: Partial<FoodRecord> & { item_id?: number }) {
    if (body.item_id)
      this.foodService.updateFood(body.item_id, body)
    return rawResponse({ status: 1, success: '修改食品信息成功' })
  }

  @Delete('shopping/v2/food/:foodId')
  @ApiOperation({ summary: '删除食品' })
  deleteFood(@Param('foodId', ParseIntPipe) foodId: number) {
    return rawResponse(this.foodService.deleteFood(foodId))
  }

  @Get('ugc/v2/restaurants/:restaurantId/ratings/tags')
  @ApiOperation({ summary: '评价分类' })
  getRatingTags(@Param('restaurantId', ParseIntPipe) _restaurantId: number) {
    return rawResponse(this.foodService.getRatingTags())
  }

  @Get('ugc/v2/restaurants/:restaurantId/ratings')
  @ApiOperation({ summary: '评价列表' })
  getRatings(
    @Param('restaurantId', ParseIntPipe) _restaurantId: number,
    @Query('offset') offset = '0',
    @Query('limit') limit = '10',
  ) {
    return rawResponse(this.foodService.getRatings(Number(offset), Number(limit)))
  }
}

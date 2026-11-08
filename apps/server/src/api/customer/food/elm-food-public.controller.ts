import { Controller, DefaultValuePipe, Get, Param, ParseBoolPipe, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmFoodService } from '../../../modules/elm-catalog/services/elm-food.service'
import { CategoryFoodsQueryDto } from './dto/category-foods-query.dto'

@ApiTags('消费者端－食品菜单')
@Controller()
export class ElmFoodPublicController {
  constructor(private readonly foodService: ElmFoodService) {}

  @Get('shopping/v2/menu')
  @ApiOperation({ summary: '获取菜单列表；include_foods=false 时只返回分类和菜品数量' })
  @ApiQuery({
    name: 'include_foods',
    required: false,
    type: Boolean,
    description: '默认 true（兼容全量菜单）；点菜页传 false',
  })
  async getMenu(
    @Query('restaurant_id', ParseIntPipe) restaurantId: number,
    @Query('include_foods', new DefaultValuePipe(true), ParseBoolPipe) includeFoods = true,
  ) {
    return rawResponse(await (includeFoods
      ? this.foodService.getMenuForApi(restaurantId)
      : this.foodService.getMenuForApi(restaurantId, false)))
  }

  @Get('shopping/v2/menu/:categoryId/foods')
  @ApiOperation({ summary: '按分类分页获取菜品（每页默认 20 条，上限 50 条）' })
  async getCategoryFoods(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query() query: CategoryFoodsQueryDto,
  ) {
    return rawResponse(await this.foodService.getCategoryFoods(
      query.restaurant_id,
      categoryId,
      query.offset,
      query.limit,
    ))
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
}

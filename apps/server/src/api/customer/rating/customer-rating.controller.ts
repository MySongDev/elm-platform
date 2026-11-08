import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmFoodService } from '../../../modules/elm-catalog/services/elm-food.service'

@ApiTags('消费者端－评价')
@Controller()
export class CustomerRatingController {
  constructor(private readonly foodService: ElmFoodService) {}

  @Get('ugc/v2/restaurants/:restaurantId/ratings/tags')
  @ApiOperation({
    operationId: 'ElmFoodPublicController_getRatingTags',
    summary: '评价分类',
  })
  getRatingTags(@Param('restaurantId', ParseIntPipe) _restaurantId: number) {
    return rawResponse(this.foodService.getRatingTags())
  }

  @Get('ugc/v2/restaurants/:restaurantId/ratings')
  @ApiOperation({
    operationId: 'ElmFoodPublicController_getRatings',
    summary: '评价列表',
  })
  async getRatings(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query('offset') offset = '0',
    @Query('limit') limit = '10',
  ) {
    return rawResponse(await this.foodService.getRatings(Number(offset), Number(limit), restaurantId))
  }
}

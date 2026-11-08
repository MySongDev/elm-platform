import type { FoodRecord } from '../../../modules/elm-catalog/types/elm-catalog.types'
import { Body, Controller, Delete, Param, ParseIntPipe, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmFoodService } from '../../../modules/elm-catalog/services/elm-food.service'

/** 旧 Elm 写入契约：原接口没有 JWT Guard，本次仅隔离归属，不代表已获得管理端权限保护。 */
@ApiTags('兼容接口－食品写入')
@Controller()
export class ElmFoodManagementController {
  constructor(private readonly foodService: ElmFoodService) {}

  @Post('shopping/v2/addfood')
  @ApiOperation({
    operationId: 'ElmFoodPublicController_addFood',
    summary: '添加食品',
  })
  async addFood(@Body() body: Partial<FoodRecord>) {
    await this.foodService.createFood(body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '添加食品成功',
    })
  }

  @Post('shopping/v2/updatefood')
  @ApiOperation({
    operationId: 'ElmFoodPublicController_updateFood',
    summary: '更新食品',
  })
  async updateFood(@Body() body: Partial<FoodRecord> & { item_id?: number }) {
    if (body.item_id)
      await this.foodService.updateFood(body.item_id, body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '修改食品信息成功',
    })
  }

  @Delete('shopping/v2/food/:foodId')
  @ApiOperation({
    operationId: 'ElmFoodPublicController_deleteFood',
    summary: '删除食品',
  })
  async deleteFood(@Param('foodId', ParseIntPipe) foodId: number) {
    return rawResponse(await this.foodService.deleteFood(foodId))
  }
}

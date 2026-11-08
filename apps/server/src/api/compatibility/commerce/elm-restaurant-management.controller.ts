import type { RestaurantRecord } from '../../../modules/elm-catalog/types/elm-catalog.types'
import { Body, Controller, Delete, Param, ParseIntPipe, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ElmRestaurantService } from '../../../modules/elm-catalog/services/elm-restaurant.service'

/** 旧 Elm 写入契约：原接口没有 JWT Guard，本次仅隔离归属，不代表已获得管理端权限保护。 */
@ApiTags('兼容接口－餐馆写入')
@Controller()
export class ElmRestaurantManagementController {
  constructor(private readonly restaurantService: ElmRestaurantService) {}

  @Post('shopping/addshop')
  @ApiOperation({
    operationId: 'ElmRestaurantPublicController_addRestaurant',
    summary: '添加餐馆',
  })
  async addRestaurant(@Body() body: Partial<RestaurantRecord>) {
    await this.restaurantService.createRestaurant(body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '添加餐馆成功',
    })
  }

  @Post('shopping/updateshop')
  @ApiOperation({
    operationId: 'ElmRestaurantPublicController_updateRestaurant',
    summary: '更新餐馆',
  })
  async updateRestaurant(@Body() body: Partial<RestaurantRecord> & { id?: number }) {
    if (body.id)
      await this.restaurantService.updateRestaurant(body.id, body as Partial<Record<string, unknown>>)
    return rawResponse({
      status: 1,
      success: '修改商铺信息成功',
    })
  }

  @Delete('shopping/restaurant/:restaurantId')
  @ApiOperation({
    operationId: 'ElmRestaurantPublicController_deleteRestaurant',
    summary: '删除餐馆',
  })
  async deleteRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    return rawResponse(await this.restaurantService.deleteRestaurant(restaurantId))
  }
}

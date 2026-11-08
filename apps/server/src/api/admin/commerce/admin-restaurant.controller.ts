import type { RestaurantRecord } from '../../../modules/elm-catalog/types/elm-catalog.types'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { ElmRestaurantService } from '../../../modules/elm-catalog/services/elm-restaurant.service'
import { TenantContextService } from '../../../modules/tenant/tenant-context.service'

@ApiTags('管理端－餐馆管理')
@ApiBearerAuth()
@Controller('admin/commerce/restaurants')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminRestaurantController {
  constructor(
    private readonly restaurantService: ElmRestaurantService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_getRestaurants',
    summary: '管理端餐馆列表',
  })
  async getRestaurants(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.listRestaurants({ limit: 100 }, context)
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_createRestaurant',
    summary: '管理端创建餐馆',
  })
  async createRestaurant(@Body() body: Partial<RestaurantRecord>, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.createRestaurant(body, context)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_updateRestaurant',
    summary: '管理端更新餐馆',
  })
  async updateRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<RestaurantRecord>,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.updateRestaurant(id, body, context)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_deleteRestaurant',
    summary: '管理端删除餐馆',
  })
  async deleteRestaurant(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.deleteRestaurant(id, context)
  }
}

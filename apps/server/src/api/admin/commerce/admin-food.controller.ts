import type { FoodRecord } from '../../../modules/elm-catalog/types/elm-catalog.types'
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { ElmFoodService } from '../../../modules/elm-catalog/services/elm-food.service'
import { TenantContextService } from '../../../modules/tenant/tenant-context.service'

@ApiTags('管理端－食品管理')
@ApiBearerAuth()
@Controller('admin/commerce/foods')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminFoodController {
  constructor(
    private readonly foodService: ElmFoodService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_getFoods',
    summary: '管理端食品列表',
  })
  async getFoods(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.listFoods({ limit: 100 }, context)
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_createFood',
    summary: '管理端创建食品',
  })
  async createFood(@Body() body: Partial<FoodRecord>, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.createFood(body, context)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_updateFood',
    summary: '管理端更新食品',
  })
  async updateFood(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<FoodRecord>,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.updateFood(id, body, context)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'ElmAdminController_deleteFood',
    summary: '管理端删除食品',
  })
  async deleteFood(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.deleteFood(id, context)
  }
}

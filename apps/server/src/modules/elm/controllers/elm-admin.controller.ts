import type { FoodRecord, RestaurantRecord } from '../types/elm.types'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { RequirePermissions } from '../../auth/decorators/permissions.decorator'
import { Roles } from '../../auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { AdminOrderDetailHttpResponseDto } from '../../order/dto/admin-order-detail.dto'
import { ApproveRefundDto, RejectRefundDto } from '../../order/dto/reject-refund.dto'
import { OrderWorkflowService } from '../../order/order-workflow.service'
import { PaymentService } from '../../payment/payment.service'
import { TenantContextService } from '../../tenant/tenant-context.service'
import { ElmFoodService } from '../services/elm-food.service'
import { ElmRestaurantService } from '../services/elm-restaurant.service'

@ApiTags('业务管理')
@ApiBearerAuth()
@Controller('admin/commerce')
@UseGuards(AdminAuthGuard, RolesGuard)
export class ElmAdminController {
  constructor(
    private readonly restaurantService: ElmRestaurantService,
    private readonly foodService: ElmFoodService,
    private readonly paymentService: PaymentService,
    private readonly orderWorkflow: OrderWorkflowService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: '管理端餐馆列表' })
  async getRestaurants(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.listRestaurants({ limit: 100 }, context)
  }

  @Post('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: '管理端创建餐馆' })
  async createRestaurant(@Body() body: Partial<RestaurantRecord>, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.createRestaurant(body, context)
  }

  @Patch('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新餐馆' })
  async updateRestaurant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<RestaurantRecord>,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.updateRestaurant(id, body, context)
  }

  @Delete('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端删除餐馆' })
  async deleteRestaurant(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.restaurantService.deleteRestaurant(id, context)
  }

  @Get('foods')
  @Roles('admin')
  @ApiOperation({ summary: '管理端食品列表' })
  async getFoods(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.listFoods({ limit: 100 }, context)
  }

  @Post('foods')
  @Roles('admin')
  @ApiOperation({ summary: '管理端创建食品' })
  async createFood(@Body() body: Partial<FoodRecord>, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.createFood(body, context)
  }

  @Patch('foods/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端更新食品' })
  async updateFood(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<FoodRecord>,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.updateFood(id, body, context)
  }

  @Delete('foods/:id')
  @Roles('admin')
  @ApiOperation({ summary: '管理端删除食品' })
  async deleteFood(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.foodService.deleteFood(id, context)
  }

  @Get('orders')
  @RequirePermissions('commerce:order:view')
  @ApiOperation({ summary: '管理端真实支付订单列表' })
  async getOrders(@Request() req: any, @Query() query: Record<string, unknown> = {}) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.paymentService.listAdminOrders(query.limit, context, query as any)
  }

  @Get('orders/:orderNo')
  @RequirePermissions('commerce:order:view')
  @ApiOperation({ summary: '管理端订单详情' })
  @ApiParam({
    name: 'orderNo',
    example: 'ELMDEMO202606020001',
  })
  @ApiOkResponse({
    description: 'Admin order detail response envelope',
    type: AdminOrderDetailHttpResponseDto,
  })
  async getOrderDetail(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.getAdminOrderDetail(orderNo, context)
  }

  @Post('orders/:orderNo/accept')
  @RequirePermissions('commerce:order:accept')
  @ApiOperation({ summary: '管理端订单接单' })
  async acceptOrder(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.acceptOrder(orderNo, this.toAdminOperator(req), context)
  }

  @Post('orders/:orderNo/start-preparing')
  @RequirePermissions('commerce:order:prepare')
  @ApiOperation({ summary: '管理端订单开始制作' })
  async startPreparing(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.startPreparing(orderNo, this.toAdminOperator(req), context)
  }

  @Post('orders/:orderNo/start-delivery')
  @RequirePermissions('commerce:order:deliver')
  @ApiOperation({ summary: '管理端订单开始配送' })
  async startDelivery(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.startDelivery(orderNo, this.toAdminOperator(req), context)
  }

  @Post('orders/:orderNo/complete')
  @RequirePermissions('commerce:order:complete')
  @ApiOperation({ summary: '管理端订单完成' })
  async completeOrder(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.completeOrder(orderNo, this.toAdminOperator(req), context)
  }

  @Post('orders/:orderNo/refund/approve')
  @RequirePermissions('commerce:order:refund:approve')
  @ApiOperation({ summary: '管理端同意退款' })
  async approveRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: ApproveRefundDto,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.approveRefund(orderNo, this.toAdminOperator(req), dto.remark, context)
  }

  @Post('orders/:orderNo/refund/reject')
  @RequirePermissions('commerce:order:refund:reject')
  @ApiOperation({ summary: '管理端驳回退款' })
  async rejectRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: RejectRefundDto,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.rejectRefund(orderNo, this.toAdminOperator(req), dto.reason, context)
  }

  private toAdminOperator(req: any) {
    const userId = String(req.user?.id || '')
    return {
      operatorId: userId,
      operatorName: req.user?.username || `admin#${userId}`,
      operatorType: 'ADMIN' as const,
    }
  }
}

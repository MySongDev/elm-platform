import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { RequirePermissions } from '../../../modules/auth/decorators/permissions.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { OrderQueryService } from '../../../modules/order/order-query.service'
import { OrderWorkflowService } from '../../../modules/order/order-workflow.service'
import { TenantContextService } from '../../../modules/tenant/tenant-context.service'
import { AdminOrderDetailHttpResponseDto } from './dto/admin-order-detail.dto'
import { AdminOrderListHttpResponseDto } from './dto/admin-order-list.dto'
import { ApproveRefundDto, RejectRefundDto } from './dto/reject-refund.dto'

@ApiTags('管理端－订单管理')
@ApiBearerAuth()
@Controller('admin/commerce/orders')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminOrderController {
  constructor(
    private readonly orderQuery: OrderQueryService,
    private readonly orderWorkflow: OrderWorkflowService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @RequirePermissions('commerce:order:view')
  @ApiOperation({
    operationId: 'ElmAdminController_getOrders',
    summary: '管理端真实支付订单列表',
  })
  @ApiOkResponse({
    description: 'Admin order list response envelope',
    type: AdminOrderListHttpResponseDto,
  })
  async getOrders(@Request() req: any, @Query() query: Record<string, unknown> = {}) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderQuery.listAdminOrders(query.limit, context, query as any)
  }

  @Get(':orderNo')
  @RequirePermissions('commerce:order:view')
  @ApiOperation({
    operationId: 'ElmAdminController_getOrderDetail',
    summary: '管理端订单详情',
  })
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
    return this.orderQuery.getAdminOrderDetail(orderNo, context)
  }

  @Post(':orderNo/accept')
  @RequirePermissions('commerce:order:accept')
  @ApiOperation({
    operationId: 'ElmAdminController_acceptOrder',
    summary: '管理端订单接单',
  })
  async acceptOrder(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.acceptOrder(orderNo, this.toAdminOperator(req), context)
  }

  @Post(':orderNo/start-preparing')
  @RequirePermissions('commerce:order:prepare')
  @ApiOperation({
    operationId: 'ElmAdminController_startPreparing',
    summary: '管理端订单开始制作',
  })
  async startPreparing(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.startPreparing(orderNo, this.toAdminOperator(req), context)
  }

  @Post(':orderNo/start-delivery')
  @RequirePermissions('commerce:order:deliver')
  @ApiOperation({
    operationId: 'ElmAdminController_startDelivery',
    summary: '管理端订单开始配送',
  })
  async startDelivery(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.startDelivery(orderNo, this.toAdminOperator(req), context)
  }

  @Post(':orderNo/complete')
  @RequirePermissions('commerce:order:complete')
  @ApiOperation({
    operationId: 'ElmAdminController_completeOrder',
    summary: '管理端订单完成',
  })
  async completeOrder(@Param('orderNo') orderNo: string, @Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.completeOrder(orderNo, this.toAdminOperator(req), context)
  }

  @Post(':orderNo/refund/approve')
  @RequirePermissions('commerce:order:refund:approve')
  @ApiOperation({
    operationId: 'ElmAdminController_approveRefund',
    summary: '管理端同意退款',
  })
  async approveRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: ApproveRefundDto,
    @Request() req: any,
  ) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.orderWorkflow.approveRefund(orderNo, this.toAdminOperator(req), dto.remark, context)
  }

  @Post(':orderNo/refund/reject')
  @RequirePermissions('commerce:order:refund:reject')
  @ApiOperation({
    operationId: 'ElmAdminController_rejectRefund',
    summary: '管理端驳回退款',
  })
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

import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ApiErrorResponses, ApiRawResponse } from '../../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../../../modules/customer-auth/guards/customer-auth.guard'
import { OrderQueryService } from '../../../modules/order/order-query.service'
import { OrderWorkflowService } from '../../../modules/order/order-workflow.service'
import { PaymentOrdersResponseDto, PaymentOrderSummaryResponseDto } from '../payment/dto/payment-response.dto'
import { CreateOrderDto } from './dto/create-order.dto'
import { RequestRefundDto } from './dto/request-refund.dto'

/**
 * 消费者订单入口：建单、订单列表和退款申请放在同一资源下，不再借用支付 Controller。
 * POST /orders 只建单；H5 的支付宝建单并支付入口继续保留，两个入口共享建单规则。
 * 响应 DTO 暂沿用 payment 中的原类，避免移动契约时另造一份同名或同字段的 OpenAPI schema。
 * 从 PaymentController 迁入的方法显式保留旧 operationId，代码归属变动不应改写生成客户端的契约。
 */
@ApiTags('消费者端－订单')
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderWorkflow: OrderWorkflowService,
    private readonly orderQuery: OrderQueryService,
  ) {}

  /**
   * 创建一笔待支付订单（PENDING）。
   *
   * 与支付宝建单端点的差异：**不返回 payUrl**，也不调用任何支付渠道。
   * 后续支付由各端自行发起 —— H5 可用 `POST /api/payments/alipay/wap/resume`（传 orderNo）继续支付，
   * 小程序端在接入微信支付前保持 PENDING。
   *
   * 响应结构与 `GET /api/orders` 列表里的单项一致，前端拿到即可直接渲染。
   */
  @Post()
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建订单（不含支付）' })
  @ApiRawResponse(PaymentOrderSummaryResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 500)
  async createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    // userId 一律取自守卫解析出的 token，不接受请求体传入（见 CreateOrderDto 注释）
    const result = await this.orderWorkflow.createOrder({
      ...dto,
      userId: String(req.user.id),
    })
    return rawResponse(result)
  }

  @Post(':orderNo/refund/request')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'PaymentController_requestRefund',
    summary: '用户申请订单退款',
  })
  @ApiRawResponse(PaymentOrderSummaryResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 404, 409, 500)
  async requestRefund(
    @Param('orderNo') orderNo: string,
    @Body() dto: RequestRefundDto,
    @Request() req: any,
  ) {
    const userId = String(req.user.id)
    const result = await this.orderWorkflow.requestRefund(orderNo, {
      userId,
      reason: dto.reason,
      operator: {
        operatorId: userId,
        operatorName: req.user.phone || `customer#${userId}`,
        operatorType: 'CUSTOMER',
      },
    })
    return rawResponse(result)
  }

  @Get()
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'PaymentController_listOrders',
    summary: '用户支付订单列表',
  })
  @ApiRawResponse(PaymentOrdersResponseDto)
  @ApiErrorResponses(401, 500)
  async listOrders(@Request() req: any, @Query('limit') limit?: string) {
    const result = await this.orderQuery.listOrders(String(req.user.id), limit)
    return rawResponse(result)
  }
}

import { Body, Controller, Get, HttpCode, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger'
import { rawResponse } from '../../common/interceptors/transform.interceptor'
import { ApiErrorResponses, ApiRawResponse } from '../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../customer-auth/guards/customer-auth.guard'
import { RequestRefundDto } from '../order/dto/request-refund.dto'
import { OrderWorkflowService } from '../order/order-workflow.service'
import { CreateAlipayWapPaymentDto } from './dto/create-alipay-wap-payment.dto'
import {
  AlipayWapPaymentResponseDto,
  PaymentOrdersResponseDto,
  PaymentOrderSummaryResponseDto,
} from './dto/payment-response.dto'
import { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'
import { PaymentService } from './payment.service'

@ApiTags('支付')
@Controller()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderWorkflow: OrderWorkflowService,
  ) {}

  @Post('payments/alipay/wap/create')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建支付宝 WAP 支付单' })
  @ApiRawResponse(AlipayWapPaymentResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 500)
  async createAlipayWapPayment(@Body() dto: CreateAlipayWapPaymentDto, @Request() req: any) {
    const result = await this.paymentService.createAlipayWapPayment({
      ...dto,
      userId: String(req.user.id),
    })
    return rawResponse(result)
  }

  @Post('payments/alipay/wap/resume')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '继续支付宝 WAP 支付单' })
  @ApiRawResponse(AlipayWapPaymentResponseDto)
  @ApiErrorResponses(400, 401, 404, 500)
  @HttpCode(200)
  async resumeAlipayWapPayment(@Body() dto: ResumeAlipayWapPaymentDto, @Request() req: any) {
    const result = await this.paymentService.resumeAlipayWapPayment({
      ...dto,
      userId: String(req.user.id),
    })
    return rawResponse(result)
  }

  @Get('payments/alipay/status/:orderNo')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询支付宝支付状态' })
  @ApiRawResponse(PaymentOrderSummaryResponseDto)
  @ApiErrorResponses(401, 404, 500)
  async getAlipayPaymentStatus(
    @Param('orderNo') orderNo: string,
    @Query('refresh') refresh?: string,
    @Request() req?: any,
  ) {
    const result = await this.paymentService.getAlipayPaymentStatus(orderNo, refresh !== '0', String(req.user.id))
    return rawResponse(result)
  }

  @Post('orders/:orderNo/refund/request')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户申请订单退款' })
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

  @Post('payments/alipay/notify')
  @ApiOperation({ summary: '支付宝异步通知' })
  @SwaggerApiResponse({
    status: 201,
    description: '处理结果',
    schema: {
      type: 'string',
      enum: ['success', 'failure'],
    },
  })
  @ApiErrorResponses(500)
  async handleAlipayNotify(@Body() body: Record<string, unknown>) {
    const ok = await this.paymentService.handleAlipayNotify(body)
    return rawResponse(ok ? 'success' : 'failure')
  }

  @Get('orders')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户支付订单列表' })
  @ApiRawResponse(PaymentOrdersResponseDto)
  @ApiErrorResponses(401, 500)
  async listOrders(@Request() req: any, @Query('limit') limit?: string) {
    const result = await this.paymentService.listOrders(String(req.user.id), limit)
    return rawResponse(result)
  }
}

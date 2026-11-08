import { Body, Controller, Get, HttpCode, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ApiErrorResponses, ApiRawResponse } from '../../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../../../modules/customer-auth/guards/customer-auth.guard'
import { PaymentService } from '../../../modules/payment/payment.service'
import { CreateAlipayWapPaymentDto } from './dto/create-alipay-wap-payment.dto'
import { AlipayWapPaymentResponseDto, PaymentOrderSummaryResponseDto } from './dto/payment-response.dto'
import { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'

@ApiTags('消费者端－支付')
@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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
}

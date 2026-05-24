import type { CreateAlipayWapPaymentDto } from './dto/create-alipay-wap-payment.dto'
import type { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'
import type { PaymentService } from './payment.service'
import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../common/interceptors/transform.interceptor'
import { CustomerAuthGuard } from '../customer-auth/guards/customer-auth.guard'

@ApiTags('支付')
@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payments/alipay/wap/create')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建支付宝 WAP 支付单' })
  createAlipayWapPayment(@Body() dto: CreateAlipayWapPaymentDto, @Request() req: any) {
    return rawResponse(this.paymentService.createAlipayWapPayment({
      ...dto,
      userId: String(req.user.id),
    }))
  }

  @Post('payments/alipay/wap/resume')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '继续支付宝 WAP 支付单' })
  resumeAlipayWapPayment(@Body() dto: ResumeAlipayWapPaymentDto, @Request() req: any) {
    return rawResponse(this.paymentService.resumeAlipayWapPayment({
      ...dto,
      userId: String(req.user.id),
    }))
  }

  @Get('payments/alipay/status/:orderNo')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询支付宝支付状态' })
  getAlipayPaymentStatus(
    @Param('orderNo') orderNo: string,
    @Query('refresh') refresh?: string,
    @Request() req?: any,
  ) {
    return rawResponse(this.paymentService.getAlipayPaymentStatus(orderNo, refresh !== '0', String(req.user.id)))
  }

  @Post('payments/alipay/notify')
  @ApiOperation({ summary: '支付宝异步通知' })
  async handleAlipayNotify(@Body() body: Record<string, unknown>) {
    const ok = await this.paymentService.handleAlipayNotify(body)
    return rawResponse(ok ? 'success' : 'failure')
  }

  @Get('orders')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户支付订单列表' })
  listOrders(@Request() req: any, @Query('limit') limit?: string) {
    return rawResponse(this.paymentService.listOrders(String(req.user.id), limit))
  }
}

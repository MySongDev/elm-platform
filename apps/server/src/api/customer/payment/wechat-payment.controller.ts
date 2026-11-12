import { Body, Controller, Get, HttpCode, Param, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ApiErrorResponses, ApiRawResponse } from '../../../common/swagger/api-response.decorator'
import { CustomerAuthGuard } from '../../../modules/customer-auth/guards/customer-auth.guard'
import { WechatPaymentService } from '../../../modules/payment/wechat/wechat-payment.service'
import { CreateWechatOrderDto, ResumeWechatPaymentDto, WechatPaymentResponseDto } from './dto/create-wechat-payment.dto'
import { PaymentOrderSummaryResponseDto } from './dto/payment-response.dto'

@ApiTags('消费者端－支付')
@Controller()
export class WechatPaymentController {
  constructor(private readonly wechatPaymentService: WechatPaymentService) {}

  @Post('payments/wechat/create')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建微信支付订单（服务端查价 + 请求幂等）' })
  @ApiRawResponse(PaymentOrderSummaryResponseDto, { status: 201 })
  @ApiErrorResponses(400, 401, 409, 500)
  async createOrder(@Body() dto: CreateWechatOrderDto, @Request() req: any) {
    const result = await this.wechatPaymentService.createOrder({
      userId: String(req.user.id),
      requestId: dto.requestId,
      shopId: dto.shopId,
      cartItems: dto.cartItems,
    })
    return rawResponse(result)
  }

  @Post('payments/wechat/resume')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '为已建订单生成微信预支付参数（首次支付与续付共用）' })
  @ApiRawResponse(WechatPaymentResponseDto)
  @ApiErrorResponses(400, 401, 404, 500)
  @HttpCode(200)
  async resumePayment(@Body() dto: ResumeWechatPaymentDto, @Request() req: any) {
    const result = await this.wechatPaymentService.createPaymentParams({
      userId: String(req.user.id),
      orderNo: dto.orderNo,
      code: dto.code,
    })
    return rawResponse(result)
  }

  /**
   * 微信订单查单。`refresh` 不是 '0' 时主动向微信查一次并落库。
   *
   * 单独放在微信这边而不是复用 `/payments/alipay/status`：那条路径会去调支付宝查单，
   * 对微信单只会回本地快照（S1 加的隔离），小程序端拿它永远看不到到账。
   */
  @Get('payments/wechat/status/:orderNo')
  @UseGuards(CustomerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询微信订单支付状态（可主动查单刷新）' })
  @ApiRawResponse(PaymentOrderSummaryResponseDto)
  @ApiErrorResponses(401, 404, 500)
  async getStatus(
    @Param('orderNo') orderNo: string,
    @Query('refresh') refresh: string | undefined,
    @Request() req: any,
  ) {
    const input = {
      userId: String(req.user.id),
      orderNo,
    }
    // refresh=0 只回本地快照，不访问微信；用于页面轮询里避免每屏都打一次外部接口。
    const result = refresh === '0'
      ? await this.wechatPaymentService.getOrderStatus(input)
      : await this.wechatPaymentService.refreshOrderStatus(input)
    return rawResponse(result)
  }
}

import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { ApiErrorResponses } from '../../../common/swagger/api-response.decorator'
import { PaymentService } from '../../../modules/payment/payment.service'

/** 回调不走消费者 JWT；验签、商户身份和金额核对仍由 PaymentService 执行。 */
@ApiTags('第三方回调－支付宝')
@Controller()
export class AlipayNotifyController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payments/alipay/notify')
  @ApiOperation({
    operationId: 'PaymentController_handleAlipayNotify',
    summary: '支付宝异步通知',
  })
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
}

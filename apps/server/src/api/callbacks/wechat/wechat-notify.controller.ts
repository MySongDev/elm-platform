import type { RawBodyRequest } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Controller, HttpCode, Logger, Post, Req, Res } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { WechatPaymentService } from '../../../modules/payment/wechat/wechat-payment.service'

/** 微信自己按签名认证通知，不走消费者 JWT；处理失败必须回非 2xx，否则微信会停止重推。 */
@Controller()
export class WechatNotifyController {
  private readonly logger = new Logger(WechatNotifyController.name)

  constructor(private readonly wechatPayment: WechatPaymentService) {}

  @Post('payments/wechat/notify')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleNotify(@Req() req: RawBodyRequest<Request>, @Res({ passthrough: true }) response: Response) {
    let ok = false
    try {
      // 验签必须用原始字节，解析后的 body 不能重组为签名原文。
      ok = await this.wechatPayment.handleNotification(
        req.headers as Record<string, string | string[] | undefined>,
        req.rawBody ?? Buffer.alloc(0),
      )
    }
    catch (error) {
      this.logger.error('微信支付通知处理异常', error instanceof Error ? error.stack : String(error))
    }

    if (!ok)
      this.logger.warn('微信支付通知处理未通过，已回 HTTP 500 让微信重推')

    // 只设置状态，不直接 send：响应体仍通过 rawResponse 原样返回，避免套上项目通用信封。
    response.status(ok ? 200 : 500)
    return rawResponse(ok
      ? {
          code: 'SUCCESS',
          message: '成功',
        }
      : {
          code: 'FAIL',
          message: '处理失败',
        })
  }
}

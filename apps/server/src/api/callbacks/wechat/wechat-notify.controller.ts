import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { Controller, HttpCode, Logger, Post, Req } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { rawResponse } from '../../../common/interceptors/transform.interceptor'
import { WechatPaymentService } from '../../../modules/payment/wechat/wechat-payment.service'

/**
 * 微信支付结果通知。不走消费者 JWT：真伪由微信签名 + 平台公钥验签保证。
 *
 * 必须自己决定 HTTP 状态码和响应体，且**永远回 200**：
 * 微信认定的成功是 `200 + {"code":"SUCCESS"}`，任何非 200 或别的格式都会按退避策略重推。
 * 所以这里不回抛异常——抛出去会被全局过滤器包成 `{code:500,...}`，
 * 失败原因只写日志，由业务层返回值决定是让微信重推还是停止。
 */
@Controller()
export class WechatNotifyController {
  private readonly logger = new Logger(WechatNotifyController.name)

  constructor(private readonly wechatPayment: WechatPaymentService) {}

  @Post('payments/wechat/notify')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleNotify(@Req() req: RawBodyRequest<Request>) {
    let ok = false
    try {
      // 验签必须用原始字节：req.body 已被 JSON 解析器改写，重组签名原文必失败。
      ok = await this.wechatPayment.handleNotification(
        req.headers as Record<string, string | string[] | undefined>,
        req.rawBody ?? Buffer.alloc(0),
      )
    }
    catch (error) {
      // 兜底：业务层自己已 catch 过，走到这里说明有更意外的异常。
      // 不能让它冒到全局过滤器——那边会返回非 200 + 另一种 code 结构，
      // 微信会把它当失败重推，而重推解决不了这类 bug，只会刷满日志。
      this.logger.error('微信支付通知处理异常', error instanceof Error ? error.stack : String(error))
    }

    if (!ok)
      this.logger.warn('微信支付通知处理未通过，已回 FAIL 让微信重推')

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

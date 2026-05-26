import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import AlipaySdk from 'alipay-sdk'

interface AlipayConfig {
  gateway: string
  appId: string
  privateKey: string
  alipayPublicKey: string
  notifyUrl: string
  returnUrl: string
  sellerId: string
}

interface PaymentOrderForAlipay {
  orderNo: string
  payableAmount: number
  subject: string
}

@Injectable()
export class AlipayService {
  private sdkInstance: AlipaySdk | null = null

  constructor(private readonly configService: ConfigService) {}

  hasConfig() {
    const config = this.getConfig()
    return Boolean(config.appId && config.privateKey && config.alipayPublicKey)
  }

  createWapPayUrl(order: PaymentOrderForAlipay) {
    const sdk = this.getSdk()
    const config = this.getConfig()

    return sdk.pageExec('alipay.trade.wap.pay', {
      method: 'GET',
      notifyUrl: config.notifyUrl,
      returnUrl: `${config.returnUrl}?orderNo=${order.orderNo}`,
      bizContent: {
        out_trade_no: order.orderNo,
        total_amount: order.payableAmount.toFixed(2),
        subject: order.subject,
        product_code: 'QUICK_WAP_WAY',
        quit_url: `${config.returnUrl.replace('/payment/result', '/order')}?orderNo=${order.orderNo}`,
      },
    })
  }

  async queryTrade(orderNo: string) {
    const response = await this.getSdk().exec('alipay.trade.query', {
      bizContent: {
        out_trade_no: orderNo,
      },
    })

    return response?.alipay_trade_query_response || response
  }

  verifyNotify(params: Record<string, unknown>) {
    return this.getSdk().checkNotifySign(params)
  }

  getAppId() {
    return this.getConfig().appId
  }

  getSellerId() {
    return this.getConfig().sellerId
  }

  private getSdk() {
    if (!this.sdkInstance) {
      const config = this.getConfig()
      if (!this.hasConfig()) {
        throw new InternalServerErrorException('支付宝配置缺失，请先配置 ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY')
      }

      this.sdkInstance = new AlipaySdk({
        appId: config.appId,
        keyType: 'PKCS1',
        privateKey: config.privateKey,
        alipayPublicKey: config.alipayPublicKey,
        gateway: config.gateway,
        signType: 'RSA2',
        charset: 'utf-8',
        timeout: 5000,
        camelcase: true,
      })
    }

    return this.sdkInstance
  }

  private getConfig(): AlipayConfig {
    return {
      gateway: this.configService.get<string>('alipay.gateway', ''),
      appId: this.configService.get<string>('alipay.appId', ''),
      privateKey: this.configService.get<string>('alipay.privateKey', ''),
      alipayPublicKey: this.configService.get<string>('alipay.alipayPublicKey', ''),
      notifyUrl: this.configService.get<string>('alipay.notifyUrl', ''),
      returnUrl: this.configService.get<string>('alipay.returnUrl', ''),
      sellerId: this.configService.get<string>('alipay.sellerId', ''),
    }
  }
}

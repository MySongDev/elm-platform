import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { AlipayService } from './alipay/alipay.service'
import { PaymentService } from './payment.service'
import { WechatPayService } from './wechat/wechat-pay.service'
import { WechatPaymentService } from './wechat/wechat-payment.service'

@Module({
  imports: [OrderModule],
  providers: [PaymentService, AlipayService, WechatPayService, WechatPaymentService],
  exports: [PaymentService, WechatPaymentService],
})
export class PaymentModule {}

import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { AlipayService } from './alipay/alipay.service'
import { PaymentService } from './payment.service'

@Module({
  imports: [OrderModule],
  providers: [PaymentService, AlipayService],
  exports: [PaymentService],
})
export class PaymentModule {}

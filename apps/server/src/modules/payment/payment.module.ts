import { Module } from '@nestjs/common'
import { AlipayService } from './alipay/alipay.service'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, AlipayService],
  exports: [PaymentService],
})
export class PaymentModule {}

import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { TenantModule } from '../tenant/tenant.module'
import { AlipayService } from './alipay/alipay.service'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

@Module({
  imports: [OrderModule, TenantModule],
  controllers: [PaymentController],
  providers: [PaymentService, AlipayService],
  exports: [PaymentService],
})
export class PaymentModule {}

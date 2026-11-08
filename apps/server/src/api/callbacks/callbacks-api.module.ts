import { Module } from '@nestjs/common'
import { PaymentModule } from '../../modules/payment/payment.module'
import { AlipayNotifyController } from './alipay/alipay-notify.controller'

/** 仅注册本端接口；业务 Provider 来自导入模块，避免重复实例化和反向依赖。 */
@Module({
  imports: [PaymentModule],
  controllers: [
    AlipayNotifyController,
  ],
})
export class CallbacksApiModule {}

import { Module } from '@nestjs/common'
import { ElmOrderService } from './services/elm-order.service'

/** 旧 Elm 兼容入口的内存演示数据，不是真实支付订单。 */
@Module({
  providers: [ElmOrderService],
  exports: [ElmOrderService],
})
export class ElmLegacyModule {}

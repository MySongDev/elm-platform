import { Module } from '@nestjs/common'
import { ElmModule } from '../../modules/elm/elm.module'
import { ElmOrderPublicController } from './order/elm-order-public.controller'

/** 仅注册本端接口；业务 Provider 来自导入模块，避免重复实例化和反向依赖。 */
@Module({
  imports: [ElmModule],
  controllers: [
    ElmOrderPublicController,
  ],
})
export class MerchantApiModule {}

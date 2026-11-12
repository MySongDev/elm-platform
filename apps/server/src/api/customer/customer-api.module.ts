import { Module } from '@nestjs/common'
import { AuthModule } from '../../modules/auth/auth.module'
import { CustomerAddressModule } from '../../modules/customer-address/customer-address.module'
import { CustomerAuthModule } from '../../modules/customer-auth/customer-auth.module'
import { CustomerAvatarModule } from '../../modules/customer-avatar/customer-avatar.module'
import { ElmModule } from '../../modules/elm/elm.module'
import { OrderModule } from '../../modules/order/order.module'
import { PaymentModule } from '../../modules/payment/payment.module'
import { CustomerAddressController } from './address/customer-address.controller'
import { CustomerAuthController } from './auth/customer-auth.controller'
import { ElmFoodPublicController } from './food/elm-food-public.controller'
import { ElmLocationController } from './location/elm-location.controller'
import { OrderController } from './order/customer-order.controller'
import { PaymentController } from './payment/customer-payment.controller'
import { WechatPaymentController } from './payment/wechat-payment.controller'
import { CustomerAvatarController } from './profile/customer-avatar.controller'
import { CustomerRatingController } from './rating/customer-rating.controller'
import { ElmRestaurantPublicController } from './restaurant/elm-restaurant-public.controller'

/** 仅注册本端接口；业务 Provider 来自导入模块，避免重复实例化和反向依赖。 */
@Module({
  imports: [AuthModule, CustomerAuthModule, CustomerAddressModule, CustomerAvatarModule, ElmModule, OrderModule, PaymentModule],
  controllers: [
    CustomerAuthController,
    CustomerAddressController,
    CustomerAvatarController,
    ElmLocationController,
    OrderController,
    PaymentController,
    WechatPaymentController,
    ElmRestaurantPublicController,
    ElmFoodPublicController,
    CustomerRatingController,
  ],
})
export class CustomerApiModule {}

import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { PaymentModule } from '../payment/payment.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmAdminController } from './controllers/elm-admin.controller'
import { ElmFoodPublicController } from './controllers/elm-food-public.controller'
import { ElmLocationController } from './controllers/elm-location.controller'
import { ElmOrderPublicController } from './controllers/elm-order-public.controller'
import { ElmRestaurantPublicController } from './controllers/elm-restaurant-public.controller'
import { ElmUserPublicController } from './controllers/elm-user-public.controller'
import { ElmCityService } from './services/elm-city.service'
import { ElmFoodService } from './services/elm-food.service'
import { ElmOrderService } from './services/elm-order.service'
import { ElmRestaurantService } from './services/elm-restaurant.service'
import { ElmStoreService } from './services/elm-store.service'
import { ElmUserCompatService } from './services/elm-user-compat.service'

@Module({
  imports: [PaymentModule, OrderModule, TenantModule],
  controllers: [
    ElmLocationController,
    ElmRestaurantPublicController,
    ElmFoodPublicController,
    ElmUserPublicController,
    ElmOrderPublicController,
    ElmAdminController,
  ],
  providers: [
    ElmStoreService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmUserCompatService,
    ElmOrderService,
  ],
  exports: [
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmUserCompatService,
    ElmOrderService,
  ],
})
export class ElmModule {}

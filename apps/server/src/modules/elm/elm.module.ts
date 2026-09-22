import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { PaymentModule } from '../payment/payment.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmAdminController } from './controllers/elm-admin.controller'
import { ElmFoodPublicController } from './controllers/elm-food-public.controller'
import { ElmLocationController } from './controllers/elm-location.controller'
import { ElmOrderPublicController } from './controllers/elm-order-public.controller'
import { ElmRestaurantPublicController } from './controllers/elm-restaurant-public.controller'
import { ElmCityService } from './services/elm-city.service'
import { ElmFoodService } from './services/elm-food.service'
import { ElmOrderService } from './services/elm-order.service'
import { ElmRestaurantService } from './services/elm-restaurant.service'
import { ElmStoreService } from './services/elm-store.service'
import { ElmUpstreamService } from './services/elm-upstream.service'

@Module({
  imports: [PaymentModule, OrderModule, TenantModule],
  controllers: [
    ElmLocationController,
    ElmRestaurantPublicController,
    ElmFoodPublicController,
    ElmOrderPublicController,
    ElmAdminController,
  ],
  providers: [
    ElmStoreService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
    ElmUpstreamService,
  ],
  exports: [
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
    ElmUpstreamService,
  ],
})
export class ElmModule {}

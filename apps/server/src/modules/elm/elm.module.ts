import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { PaymentModule } from '../payment/payment.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmAdminController } from './controllers/elm-admin.controller'
import { ElmFoodPublicController } from './controllers/elm-food-public.controller'
import { ElmImageProxyController } from './controllers/elm-image-proxy.controller'
import { ElmLocationController } from './controllers/elm-location.controller'
import { ElmOrderPublicController } from './controllers/elm-order-public.controller'
import { ElmRestaurantPublicController } from './controllers/elm-restaurant-public.controller'
import { ElmCityService } from './services/elm-city.service'
import { ElmFoodService } from './services/elm-food.service'
import { ElmImageImportService } from './services/elm-image-import.service'
import { ElmImageProxyService } from './services/elm-image-proxy.service'
import { ElmImageStorageService } from './services/elm-image-storage.service'
import { ElmOrderService } from './services/elm-order.service'
import { ElmRestaurantService } from './services/elm-restaurant.service'
import { ElmStoreService } from './services/elm-store.service'
import { ElmUpstreamImportService } from './services/elm-upstream-import.service'
import { ElmUpstreamService } from './services/elm-upstream.service'

@Module({
  imports: [PaymentModule, OrderModule, TenantModule],
  controllers: [
    ElmLocationController,
    ElmRestaurantPublicController,
    ElmFoodPublicController,
    ElmOrderPublicController,
    ElmImageProxyController,
    ElmAdminController,
  ],
  providers: [
    ElmStoreService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
    ElmUpstreamService,
    ElmUpstreamImportService,
    ElmImageProxyService,
    ElmImageStorageService,
    ElmImageImportService,
  ],
  exports: [
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
    ElmUpstreamService,
    ElmUpstreamImportService,
  ],
})
export class ElmModule {}

import { Module } from '@nestjs/common'
import { OrderModule } from '../order/order.module'
import { PaymentModule } from '../payment/payment.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmAdminController } from './controllers/admin/elm-admin.controller'
import { ElmOrderPublicController } from './controllers/merchant/elm-order-public.controller'
import { ElmImageProxyController } from './controllers/shared/elm-image-proxy.controller'
import { ElmFoodPublicController } from './controllers/user/elm-food-public.controller'
import { ElmLocationController } from './controllers/user/elm-location.controller'
import { ElmRestaurantPublicController } from './controllers/user/elm-restaurant-public.controller'
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
  // 控制器按「消费端」分目录，只是归属约定，不影响路由：
  //   admin/    管理端（/admin/commerce/*，AdminAuthGuard + RolesGuard）
  //   user/     用户端（web-user、uni-user 调用的 /shopping/*、/v1/*、/geo/*、/ugc/*）
  //   merchant/ 商家后台（上游兼容的 /bos/*）
  //   shared/   多端共用的长期契约（/img/*）
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

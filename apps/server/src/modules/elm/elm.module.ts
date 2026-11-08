import { Module } from '@nestjs/common'
import { ElmMediaModule } from '../elm-media/elm-media.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmCityService } from './services/elm-city.service'
import { ElmFoodService } from './services/elm-food.service'
import { ElmOrderService } from './services/elm-order.service'
import { ElmRestaurantService } from './services/elm-restaurant.service'
import { ElmStoreService } from './services/elm-store.service'
import { ElmUpstreamImportService } from './services/elm-upstream-import.service'
import { ElmUpstreamService } from './services/elm-upstream.service'

@Module({
  imports: [TenantModule, ElmMediaModule],
  providers: [
    ElmStoreService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
    ElmUpstreamService,
    ElmUpstreamImportService,
  ],
  exports: [
    ElmMediaModule,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
    ElmUpstreamService,
    ElmUpstreamImportService,
  ],
})
export class ElmModule {}

import { Module } from '@nestjs/common'
import { ElmMediaModule } from '../elm-media/elm-media.module'
import { ElmUpstreamModule } from '../elm-upstream/elm-upstream.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmCityService } from './services/elm-city.service'
import { ElmFoodService } from './services/elm-food.service'
import { ElmOrderService } from './services/elm-order.service'
import { ElmRestaurantService } from './services/elm-restaurant.service'
import { ElmStoreService } from './services/elm-store.service'

@Module({
  imports: [TenantModule, ElmMediaModule, ElmUpstreamModule],
  providers: [
    ElmStoreService,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
  ],
  exports: [
    ElmMediaModule,
    ElmUpstreamModule,
    ElmCityService,
    ElmRestaurantService,
    ElmFoodService,
    ElmOrderService,
  ],
})
export class ElmModule {}

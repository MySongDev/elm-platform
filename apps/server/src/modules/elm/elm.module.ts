import { Module } from '@nestjs/common'
import { ElmCatalogModule } from '../elm-catalog/elm-catalog.module'
import { ElmMediaModule } from '../elm-media/elm-media.module'
import { ElmUpstreamModule } from '../elm-upstream/elm-upstream.module'
import { ElmCityService } from './services/elm-city.service'
import { ElmOrderService } from './services/elm-order.service'
import { ElmStoreService } from './services/elm-store.service'

@Module({
  imports: [ElmMediaModule, ElmUpstreamModule, ElmCatalogModule],
  providers: [
    ElmStoreService,
    ElmCityService,
    ElmOrderService,
  ],
  exports: [
    ElmMediaModule,
    ElmUpstreamModule,
    ElmCatalogModule,
    ElmCityService,
    ElmOrderService,
  ],
})
export class ElmModule {}

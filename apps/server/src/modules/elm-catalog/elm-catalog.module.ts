import { Module } from '@nestjs/common'
import { ElmUpstreamModule } from '../elm-upstream/elm-upstream.module'
import { TenantModule } from '../tenant/tenant.module'
import { ElmFoodService } from './services/elm-food.service'
import { ElmRestaurantService } from './services/elm-restaurant.service'

/**
 * Elm 商业目录：餐馆与菜品/菜单，数据源是本地 `restaurants` / `food_categories` / `foods` 表。
 *
 * 菜单仍是「预导 + 懒加载兜底」两条路，因此依赖 elm-upstream 的导入器（单向）。
 */
@Module({
  imports: [TenantModule, ElmUpstreamModule],
  providers: [ElmRestaurantService, ElmFoodService],
  exports: [ElmRestaurantService, ElmFoodService],
})
export class ElmCatalogModule {}

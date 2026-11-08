import { Module } from '@nestjs/common'
import { ElmModule } from '../../modules/elm/elm.module'
import { ElmFoodManagementController } from './commerce/elm-food-management.controller'
import { ElmRestaurantManagementController } from './commerce/elm-restaurant-management.controller'

/** 仅注册本端接口；业务 Provider 来自导入模块，避免重复实例化和反向依赖。 */
@Module({
  imports: [ElmModule],
  controllers: [
    ElmRestaurantManagementController,
    ElmFoodManagementController,
  ],
})
export class CompatibilityApiModule {}

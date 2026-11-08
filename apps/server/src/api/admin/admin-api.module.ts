import { Module } from '@nestjs/common'
import { AuthModule } from '../../modules/auth/auth.module'
import { DeptModule } from '../../modules/dept/dept.module'
import { ElmModule } from '../../modules/elm/elm.module'
import { MenuModule } from '../../modules/menu/menu.module'
import { MerchantOnboardingModule } from '../../modules/merchant-onboarding/merchant-onboarding.module'
import { MonitorModule } from '../../modules/monitor/monitor.module'
import { NotificationModule } from '../../modules/notification/notification.module'
import { OrderModule } from '../../modules/order/order.module'
import { RoleModule } from '../../modules/role/role.module'
import { TenantModule } from '../../modules/tenant/tenant.module'
import { UserModule } from '../../modules/user/user.module'
import { AuthController } from './auth/admin-auth.controller'
import { AdminFoodController } from './commerce/admin-food.controller'
import { MerchantOnboardingController } from './commerce/admin-merchant-application.controller'
import { AdminOrderController } from './commerce/admin-order.controller'
import { AdminRestaurantController } from './commerce/admin-restaurant.controller'
import { AdminLogController } from './monitor/admin-log.controller'
import { AdminOnlineUserController } from './monitor/admin-online-user.controller'
import { NotificationController } from './notification/admin-notification.controller'
import { AdminDeptController } from './system/admin-dept.controller'
import { AdminMenuController } from './system/admin-menu.controller'
import { AdminPermissionController } from './system/admin-permission.controller'
import { AdminRoleController } from './system/admin-role.controller'
import { UserController } from './system/admin-user.controller'
import { TenantController } from './tenant/admin-tenant.controller'

/** 仅注册本端接口；业务 Provider 来自导入模块，避免重复实例化和反向依赖。 */
@Module({
  imports: [AuthModule, UserModule, RoleModule, MenuModule, DeptModule, MonitorModule, TenantModule, ElmModule, OrderModule, MerchantOnboardingModule, NotificationModule],
  controllers: [
    AuthController,
    UserController,
    TenantController,
    NotificationController,
    MerchantOnboardingController,
    AdminRoleController,
    AdminMenuController,
    AdminDeptController,
    AdminPermissionController,
    AdminOnlineUserController,
    AdminLogController,
    AdminRestaurantController,
    AdminFoodController,
    AdminOrderController,
  ],
})
export class AdminApiModule {}

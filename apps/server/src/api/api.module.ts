import { Module } from '@nestjs/common'
import { AdminApiModule } from './admin/admin-api.module'
import { CallbacksApiModule } from './callbacks/callbacks-api.module'
import { CompatibilityApiModule } from './compatibility/compatibility-api.module'
import { CustomerApiModule } from './customer/customer-api.module'
import { MerchantApiModule } from './merchant/merchant-api.module'
import { SharedApiModule } from './shared/shared-api.module'

/** 所有 HTTP 入口唯一的装配点；目录分类不添加 URL 前缀或默认权限。 */
@Module({
  imports: [AdminApiModule, CustomerApiModule, MerchantApiModule, SharedApiModule, CallbacksApiModule, CompatibilityApiModule],
})
export class ApiModule {}

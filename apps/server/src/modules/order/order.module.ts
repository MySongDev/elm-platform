import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { OrderPricingService } from './order-pricing.service'
import { OrderQueryService } from './order-query.service'
import { OrderWorkflowService } from './order-workflow.service'

@Module({
  imports: [TenantModule],
  providers: [OrderWorkflowService, OrderQueryService, OrderPricingService],
  exports: [OrderWorkflowService, OrderQueryService, OrderPricingService],
})
export class OrderModule {}

import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { OrderQueryService } from './order-query.service'
import { OrderWorkflowService } from './order-workflow.service'

@Module({
  imports: [TenantModule],
  providers: [OrderWorkflowService, OrderQueryService],
  exports: [OrderWorkflowService, OrderQueryService],
})
export class OrderModule {}

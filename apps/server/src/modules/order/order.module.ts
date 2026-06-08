import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { OrderWorkflowService } from './order-workflow.service'

@Module({
  imports: [TenantModule],
  providers: [OrderWorkflowService],
  exports: [OrderWorkflowService],
})
export class OrderModule {}

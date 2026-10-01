import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { OrderWorkflowService } from './order-workflow.service'
import { OrderController } from './order.controller'

@Module({
  imports: [TenantModule],
  controllers: [OrderController],
  providers: [OrderWorkflowService],
  exports: [OrderWorkflowService],
})
export class OrderModule {}

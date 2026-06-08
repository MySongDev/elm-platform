import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({
  imports: [TenantModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

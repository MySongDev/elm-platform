import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { LogQueryService } from './log-query.service'
import { OnlineUserService } from './online-user.service'

@Module({
  imports: [TenantModule],
  providers: [OnlineUserService, LogQueryService],
  exports: [OnlineUserService, LogQueryService],
})
export class MonitorModule {}

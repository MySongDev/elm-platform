import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { TenantAccessService } from './tenant-access.service'
import { TenantContextService } from './tenant-context.service'
import { TenantStateMachineService } from './tenant-state-machine.service'
import { TenantController } from './tenant.controller'
import { TenantService } from './tenant.service'

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantAccessService, TenantContextService, TenantStateMachineService, TenantService],
  exports: [TenantAccessService, TenantContextService, TenantStateMachineService, TenantService],
})
export class TenantModule {}

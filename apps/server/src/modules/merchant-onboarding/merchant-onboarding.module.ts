import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { MerchantOnboardingService } from './merchant-onboarding.service'

@Module({
  imports: [PrismaModule],
  providers: [MerchantOnboardingService],
  exports: [MerchantOnboardingService],
})
export class MerchantOnboardingModule {}

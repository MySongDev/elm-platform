import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { MerchantOnboardingController } from './merchant-onboarding.controller'
import { MerchantOnboardingService } from './merchant-onboarding.service'

@Module({
  imports: [PrismaModule],
  controllers: [MerchantOnboardingController],
  providers: [MerchantOnboardingService],
  exports: [MerchantOnboardingService],
})
export class MerchantOnboardingModule {}

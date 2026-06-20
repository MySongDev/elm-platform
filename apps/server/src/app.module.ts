import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from './config/configuration'
import { validateEnv } from './config/env.schema'
import { HealthModule } from './health/health.module'
import { AdminModule } from './modules/admin/admin.module'
import { AuthModule } from './modules/auth/auth.module'
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module'
import { ElmModule } from './modules/elm/elm.module'
import { MerchantOnboardingModule } from './modules/merchant-onboarding/merchant-onboarding.module'
import { NotificationModule } from './modules/notification/notification.module'
import { PaymentModule } from './modules/payment/payment.module'
import { TenantModule } from './modules/tenant/tenant.module'
import { UserModule } from './modules/user/user.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/server/.env', '.env'],
      load: [configuration],
      validate: validateEnv,
    }),

    // Prisma 模块
    PrismaModule,

    // Redis 模块
    RedisModule,
    HealthModule,

    // 业务模块
    UserModule,
    AuthModule,
    CustomerAuthModule,
    AdminModule,
    ElmModule,
    MerchantOnboardingModule,
    NotificationModule,
    PaymentModule,
    TenantModule,
  ],
})
export class AppModule {}

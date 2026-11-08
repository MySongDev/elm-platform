import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ApiModule } from './api/api.module'
import configuration from './config/configuration'
import { validateEnv } from './config/env.schema'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/server/.env', '.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    // HTTP 路由只从 ApiModule 装配；业务模块在 API 层按需导入并由 Nest 按类去重。
    ApiModule,
  ],
})
export class AppModule {}

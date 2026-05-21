import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ElmModule } from './modules/elm/elm.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Prisma 模块
    PrismaModule,

    // Redis 模块
    RedisModule,

    // 业务模块
    UserModule,
    AuthModule,
    AdminModule,
    ElmModule,
  ],
})
export class AppModule {}

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma 7 移除了 schema 内的 datasource.url，运行时连接改为通过 driver adapter 传入。
    // 连接串仍由 DATABASE_URL 提供（ConfigModule 已将 .env 载入 process.env）。
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}

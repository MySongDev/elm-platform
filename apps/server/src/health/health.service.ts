import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'

type DependencyStatus = 'ok' | 'error'

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const database = await this.checkDatabase()
    const redis = await this.checkRedis()
    const degraded = database.status === 'error' || redis.status === 'error'

    return {
      status: degraded ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      dependencies: {
        database,
        redis,
      },
    }
  }

  private async checkDatabase(): Promise<{
    status: DependencyStatus
    detail: string
  }> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1')
      return {
        status: 'ok',
        detail: 'SELECT 1 ok',
      }
    }
    catch (error) {
      return {
        status: 'error',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }

  private async checkRedis(): Promise<{
    status: DependencyStatus
    detail: string
  }> {
    try {
      const pong = await this.redis.getClient().ping()
      return {
        status: 'ok',
        detail: `PING ${pong}`,
      }
    }
    catch (error) {
      return {
        status: 'error',
        detail: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

import type { OnModuleDestroy } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis
  private readonly logger = new Logger(RedisService.name)

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db', 0),
    })

    this.client.on('connect', () => {
      this.logger.log('Redis 连接成功')
    })

    this.client.on('error', (err) => {
      this.logger.error('Redis 连接错误', err)
    })
  }

  async onModuleDestroy() {
    await this.client.quit()
  }

  /**
   * 获取 Redis 客户端实例
   */
  getClient(): Redis {
    return this.client
  }

  /**
   * 设置键值对
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  async set(key: string, value: string | number | object, ttl?: number): Promise<void> {
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
    if (ttl) {
      await this.client.set(key, val, 'EX', ttl)
    }
    else {
      await this.client.set(key, val)
    }
  }

  /**
   * 获取键值
   * @param key 键
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  /**
   * 获取对象（自动解析 JSON）
   * @param key 键
   */
  async getObject<T>(key: string): Promise<T | null> {
    const val = await this.client.get(key)
    if (!val)
      return null
    try {
      return JSON.parse(val) as T
    }
    catch {
      return val as unknown as T
    }
  }

  /**
   * 删除键
   * @param key 键
   */
  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  /**
   * 检查键是否存在
   * @param key 键
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  /**
   * 设置过期时间
   * @param key 键
   * @param seconds 秒数
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  /**
   * 自增
   * @param key 键
   * @param increment 增量，默认为 1
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    if (increment === 1) {
      return this.client.incr(key)
    }
    return this.client.incrby(key, increment)
  }
}

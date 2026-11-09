import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { RedisClientType } from 'redis'
import { setTimeout as delay } from 'node:timers/promises'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

/** 单条命令的最长等待时间，避免 Redis 异常时请求无限挂起 */
const DEFAULT_COMMAND_TIMEOUT_MS = 5000
/** 断线重连的最大间隔 */
const RECONNECT_MAX_DELAY_MS = 5000
/** 连接失败后兜底重试的间隔（正常重连由 node-redis 内部策略负责） */
const CONNECT_RETRY_DELAY_MS = 3000
/** 错误日志节流窗口，避免 Redis 长时间不可用时刷屏 */
const ERROR_LOG_INTERVAL_MS = 10000

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType
  private readonly logger = new Logger(RedisService.name)
  private shuttingDown = false
  private lastErrorLogAt = 0

  constructor(private readonly configService: ConfigService) {
    const tls = this.configService.get<boolean>('redis.tls', false)
    const commandTimeoutMs = this.configService.get<number>(
      'redis.commandTimeoutMs',
      DEFAULT_COMMAND_TIMEOUT_MS,
    )

    this.client = createClient({
      socket: {
        host: this.configService.get<string>('redis.host', 'localhost'),
        port: this.configService.get<number>('redis.port', 6379),
        tls: tls ? true : undefined,
        connectTimeout: 5000,
        reconnectStrategy: retries => this.reconnectDelay(retries),
      },
      password: this.configService.get<string>('redis.password'),
      database: this.configService.get<number>('redis.db', 0),
      commandOptions: {
        timeout: commandTimeoutMs,
      },
    })

    // node-redis 的 error 事件必须监听，否则连接异常会以 Unhandled 'error' event 崩溃进程
    this.client.on('error', (error) => {
      this.logError('Redis 连接错误', error)
    })

    this.client.on('ready', () => {
      this.logger.log('Redis 连接成功')
    })

    this.client.on('end', () => {
      if (!this.shuttingDown) {
        this.logger.warn('Redis 连接已关闭')
      }
    })
  }

  onModuleInit() {
    // 后台连接：Redis 不可用时应用仍可启动，由健康检查暴露 degraded，命令侧由超时兜底
    void this.connect()
  }

  async onModuleDestroy() {
    this.shuttingDown = true
    try {
      if (this.client.isOpen) {
        await this.client.close()
      }
      else {
        this.client.destroy()
      }
    }
    catch (error) {
      this.client.destroy()
      this.logError('Redis 关闭异常', error)
    }
  }

  /**
   * 查找匹配模式的键
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }

  /**
   * 检查 Redis 连通性
   * @remarks 未就绪时立即失败，避免健康检查排队等待
   */
  async ping(): Promise<string> {
    if (!this.client.isReady) {
      throw new Error('Redis 未就绪')
    }
    return this.client.ping()
  }

  /**
   * 向集合添加成员
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    return this.client.sAdd(key, members)
  }

  /**
   * 从集合移除成员
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    return this.client.sRem(key, members)
  }

  /**
   * 获取集合中的全部成员
   */
  async getSetMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key)
  }

  /**
   * 设置键值对
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），可选
   */
  async set(key: string, value: string | number | object, ttl?: number): Promise<void> {
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value)
    if (ttl !== undefined) {
      await this.client.set(key, val, {
        expiration: {
          type: 'EX',
          value: ttl,
        },
      })
      return
    }
    await this.client.set(key, val)
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
    return result > 0
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
   * 仅在键不存在时设置值（SET NX），用于分布式锁
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒）
   * @returns 设置成功返回 true，键已存在返回 false
   */
  async setIfAbsent(key: string, value: string, ttl: number): Promise<boolean> {
    const result = await this.client.set(key, value, {
      NX: true,
      expiration: {
        type: 'EX',
        value: ttl,
      },
    })
    return result === 'OK'
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
    return this.client.incrBy(key, increment)
  }

  /**
   * 指数退避 + 抖动，始终重试（不返回 false，避免长时间断线后彻底放弃）
   */
  private reconnectDelay(retries: number): number {
    const base = Math.min(2 ** Math.min(retries, 10) * 100, RECONNECT_MAX_DELAY_MS)
    return base + Math.floor(Math.random() * 100)
  }

  /**
   * 建立连接
   * @remarks node-redis 的 connect() 会按 reconnectStrategy 自行重试，只有主动关闭或策略放弃时才 reject；
   * 这里再兜底一次，覆盖非预期 reject 的情况
   */
  private async connect(): Promise<void> {
    while (!this.shuttingDown) {
      try {
        await this.client.connect()
        return
      }
      catch (error) {
        if (!this.shuttingDown) {
          this.logError('Redis 连接失败', error)
        }
        // isOpen 为 true 说明内部重连流程仍在运行，无需重复调用 connect()
        if (this.shuttingDown || this.client.isOpen) {
          return
        }
        await delay(CONNECT_RETRY_DELAY_MS)
      }
    }
  }

  /**
   * 节流输出错误日志
   */
  private logError(message: string, error: unknown) {
    const now = Date.now()
    if (now - this.lastErrorLogAt < ERROR_LOG_INTERVAL_MS) {
      return
    }
    this.lastErrorLogAt = now
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
    this.logger.error(`${message}: ${detail}`)
  }
}

import type { SmsProvider, SmsScene } from './sms-provider'
import { createHash, randomInt } from 'node:crypto'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '../../redis/redis.service'
import { MockSmsProvider, SMS_PROVIDER } from './sms-provider'

interface StoredSmsCode {
  hash: string
  createdAt: string
}

@Injectable()
export class SmsService {
  private readonly provider: SmsProvider
  private readonly providerName: string

  constructor(
    @Inject(RedisService)
    private readonly redis: RedisService,
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Optional()
    @Inject(SMS_PROVIDER)
    provider?: SmsProvider,
  ) {
    this.providerName = this.config.get<string>('sms.provider', 'mock')
    this.provider = provider ?? new MockSmsProvider()
  }

  async sendCode(phone: string, scene: SmsScene) {
    this.assertPhone(phone)
    await this.assertCanSend(phone)

    const code = this.config.get<string>('sms.mockCode') || String(randomInt(100000, 1000000))
    const codeKey = this.codeKey(scene, phone)
    const cooldownKey = this.cooldownKey(phone)
    const dailyKey = this.dailyKey(phone)
    const ttl = this.config.get<number>('sms.codeTtlSeconds', 300)
    const cooldown = this.config.get<number>('sms.cooldownSeconds', 60)

    await this.provider.sendCode(phone, code, scene)
    await this.redis.set(codeKey, {
      hash: this.hashCode(code),
      createdAt: new Date().toISOString(),
    }, ttl)
    await this.redis.set(cooldownKey, '1', cooldown)

    const count = await this.redis.incr(dailyKey)
    if (count === 1) {
      await this.redis.expire(dailyKey, this.secondsUntilTomorrow())
    }

    return this.providerName === 'mock'
      ? {
          success: true,
          debugCode: code,
        }
      : { success: true }
  }

  async verifyCode(phone: string, scene: SmsScene, code: string) {
    this.assertPhone(phone)
    const key = this.codeKey(scene, phone)
    const stored = await this.redis.getObject<StoredSmsCode>(key)

    if (!stored || stored.hash !== this.hashCode(code)) {
      throw new BadRequestException('验证码错误或已过期')
    }

    await this.redis.del(key)
    return true
  }

  private async assertCanSend(phone: string) {
    if (await this.redis.exists(this.cooldownKey(phone))) {
      throw this.tooManyRequests('验证码发送过于频繁')
    }

    const dailyCount = Number((await this.redis.get(this.dailyKey(phone))) || '0')
    const dailyLimit = this.config.get<number>('sms.dailyLimit', 10)
    if (dailyCount >= dailyLimit) {
      throw this.tooManyRequests('今日验证码发送次数已达上限')
    }

    if (this.providerName === 'mock' && process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException('生产环境未配置真实短信服务')
    }
    if (this.providerName !== 'mock' && this.provider instanceof MockSmsProvider) {
      throw new InternalServerErrorException('未配置真实短信服务')
    }
  }

  private assertPhone(phone: string) {
    if (!/^1\d{10}$/.test(phone)) {
      throw new BadRequestException('请输入正确的手机号')
    }
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex')
  }

  private codeKey(scene: SmsScene, phone: string) {
    return `sms:code:${scene}:${phone}`
  }

  private cooldownKey(phone: string) {
    return `sms:cooldown:${phone}`
  }

  private dailyKey(phone: string) {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `sms:daily:${phone}:${day}`
  }

  private secondsUntilTomorrow() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    return Math.max(1, Math.ceil((tomorrow.getTime() - now.getTime()) / 1000))
  }

  private tooManyRequests(message: string) {
    return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS)
  }
}

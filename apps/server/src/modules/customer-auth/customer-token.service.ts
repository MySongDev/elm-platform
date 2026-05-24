import type { JwtService } from '@nestjs/jwt'
import type { RedisService } from '../../redis/redis.service'
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'

interface CustomerUserLike {
  id: number
  phone: string
  nickname?: string | null
  avatar?: string | null
  status: number
}

interface RefreshTokenRecord {
  userId: number
  tokenHash: string
  createdAt: string
}

const CUSTOMER_ACCESS_TOKEN_EXPIRES_IN = '30m'
const CUSTOMER_ACCESS_TOKEN_TTL_SECONDS = 30 * 60
const CUSTOMER_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

@Injectable()
export class CustomerTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async sign(user: CustomerUserLike) {
    const token = this.jwtService.sign(
      {
        sub: user.id,
        phone: user.phone,
        subjectType: 'customer',
      },
      { expiresIn: CUSTOMER_ACCESS_TOKEN_EXPIRES_IN },
    )
    const refreshToken = await this.createRefreshToken(user.id)

    return {
      token,
      accessToken: token,
      expiresIn: CUSTOMER_ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      refreshExpiresIn: CUSTOMER_REFRESH_TOKEN_TTL_SECONDS,
      user: this.toProfile(user),
    }
  }

  async consumeRefreshToken(refreshToken: string) {
    const parsed = this.parseRefreshToken(refreshToken)
    if (!parsed) {
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }

    const { tokenId, secret } = parsed
    const record = await this.redis.getObject<RefreshTokenRecord>(this.refreshKey(tokenId))

    if (!record) {
      const used = await this.redis.getObject<{ userId: number }>(this.usedRefreshKey(tokenId))
      if (used?.userId) {
        await this.revokeAll(used.userId)
        await this.redis.getClient().del(this.usedRefreshKey(tokenId))
      }
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }

    if (!this.isSameHash(record.tokenHash, this.hashSecret(secret))) {
      await this.revokeAll(record.userId)
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }

    await this.redis.del(this.refreshKey(tokenId))
    await this.redis.set(this.usedRefreshKey(tokenId), { userId: record.userId }, CUSTOMER_REFRESH_TOKEN_TTL_SECONDS)
    await this.redis.getClient().srem(this.userRefreshSetKey(record.userId), tokenId)

    return { userId: record.userId }
  }

  async revoke(refreshToken?: string) {
    const parsed = this.parseRefreshToken(refreshToken)
    if (!parsed) {
      return false
    }

    const record = await this.redis.getObject<RefreshTokenRecord>(this.refreshKey(parsed.tokenId))
    if (!record) {
      return false
    }

    await this.redis.del(this.refreshKey(parsed.tokenId))
    await this.redis.getClient().srem(this.userRefreshSetKey(record.userId), parsed.tokenId)
    return true
  }

  async revokeAll(userId: number) {
    const client = this.redis.getClient()
    const userKey = this.userRefreshSetKey(userId)
    const tokenIds = await client.smembers(userKey)

    await Promise.all(
      tokenIds.flatMap(tokenId => [
        client.del(this.refreshKey(tokenId)),
        client.del(this.usedRefreshKey(tokenId)),
      ]),
    )
    await client.del(userKey)
  }

  toProfile(user: CustomerUserLike) {
    return {
      id: user.id,
      user_id: user.id,
      phone: user.phone,
      mobile: user.phone,
      username: user.nickname || user.phone,
      nickname: user.nickname,
      avatar: user.avatar || 'default.jpg',
      status: user.status,
    }
  }

  private async createRefreshToken(userId: number) {
    const tokenId = randomUUID()
    const secret = randomBytes(32).toString('base64url')
    const refreshToken = `${tokenId}.${secret}`
    const userKey = this.userRefreshSetKey(userId)

    await this.redis.set(
      this.refreshKey(tokenId),
      {
        userId,
        tokenHash: this.hashSecret(secret),
        createdAt: new Date().toISOString(),
      },
      CUSTOMER_REFRESH_TOKEN_TTL_SECONDS,
    )
    await this.redis.getClient().sadd(userKey, tokenId)
    await this.redis.getClient().expire(userKey, CUSTOMER_REFRESH_TOKEN_TTL_SECONDS)

    return refreshToken
  }

  private parseRefreshToken(refreshToken?: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      return null
    }

    const [tokenId, secret] = refreshToken.split('.')
    if (!tokenId || !secret) {
      return null
    }

    return { tokenId, secret }
  }

  private hashSecret(secret: string) {
    return createHash('sha256').update(secret).digest('hex')
  }

  private isSameHash(a: string, b: string) {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
  }

  private refreshKey(tokenId: string) {
    return `customer:refresh:${tokenId}`
  }

  private usedRefreshKey(tokenId: string) {
    return `customer:refresh:used:${tokenId}`
  }

  private userRefreshSetKey(userId: number) {
    return `customer:refresh:user:${userId}`
  }
}

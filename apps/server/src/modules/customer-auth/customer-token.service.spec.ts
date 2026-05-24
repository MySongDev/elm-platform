import { UnauthorizedException } from '@nestjs/common'
import { CustomerTokenService } from './customer-token.service'

describe('customerTokenService', () => {
  function createService() {
    const store = new Map<string, string>()
    const userSets = new Map<string, Set<string>>()

    const jwtService = {
      sign: jest.fn(() => 'access-token'),
    } as any

    const client = {
      sadd: jest.fn(async (key: string, value: string) => {
        const set = userSets.get(key) ?? new Set<string>()
        set.add(value)
        userSets.set(key, set)
      }),
      srem: jest.fn(async (key: string, value: string) => {
        userSets.get(key)?.delete(value)
      }),
      smembers: jest.fn(async (key: string) => Array.from(userSets.get(key) ?? [])),
      expire: jest.fn(),
      del: jest.fn(async (key: string) => {
        store.delete(key)
        userSets.delete(key)
      }),
    }

    const redis = {
      set: jest.fn(async (key: string, value: object, ttl?: number) => {
        store.set(key, JSON.stringify(value))
      }),
      getObject: jest.fn(async (key: string) => {
        const value = store.get(key)
        return value ? JSON.parse(value) : null
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key)
      }),
      getClient: jest.fn(() => client),
    } as any

    return { service: new CustomerTokenService(jwtService, redis), jwtService, redis, client, store, userSets }
  }

  const user = {
    id: 7,
    phone: '13800138000',
    nickname: null,
    avatar: null,
    status: 1,
  }

  it('signs short access tokens and stores only hashed refresh tokens', async () => {
    const { service, jwtService, redis, store } = createService()

    const result = await service.sign(user)
    const [tokenId, secret] = result.refreshToken.split('.')

    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: 7, phone: '13800138000', subjectType: 'customer' },
      { expiresIn: '30m' },
    )
    expect(result.token).toBe('access-token')
    expect(result.accessToken).toBe('access-token')
    expect(result.expiresIn).toBe(30 * 60)
    expect(result.refreshExpiresIn).toBe(30 * 24 * 60 * 60)
    expect(redis.set).toHaveBeenCalledWith(
      `customer:refresh:${tokenId}`,
      expect.objectContaining({ userId: 7, tokenHash: expect.any(String) }),
      30 * 24 * 60 * 60,
    )
    expect(store.get(`customer:refresh:${tokenId}`)).not.toContain(secret)
  })

  it('rotates refresh tokens by consuming the old active token', async () => {
    const { service, redis, client } = createService()
    const result = await service.sign(user)
    const [tokenId] = result.refreshToken.split('.')

    const consumed = await service.consumeRefreshToken(result.refreshToken)

    expect(consumed).toEqual({ userId: 7 })
    expect(redis.del).toHaveBeenCalledWith(`customer:refresh:${tokenId}`)
    expect(redis.set).toHaveBeenCalledWith(
      `customer:refresh:used:${tokenId}`,
      { userId: 7 },
      30 * 24 * 60 * 60,
    )
    expect(client.srem).toHaveBeenCalledWith('customer:refresh:user:7', tokenId)
  })

  it('revokes all sessions when a used refresh token is replayed', async () => {
    const { service, client } = createService()
    const first = await service.sign(user)
    const second = await service.sign(user)
    const [firstTokenId] = first.refreshToken.split('.')
    const [secondTokenId] = second.refreshToken.split('.')

    await service.consumeRefreshToken(first.refreshToken)

    await expect(service.consumeRefreshToken(first.refreshToken)).rejects.toThrow(UnauthorizedException)
    expect(client.del).toHaveBeenCalledWith(`customer:refresh:${secondTokenId}`)
    expect(client.del).toHaveBeenCalledWith(`customer:refresh:used:${firstTokenId}`)
    expect(client.del).toHaveBeenCalledWith('customer:refresh:user:7')
  })
})

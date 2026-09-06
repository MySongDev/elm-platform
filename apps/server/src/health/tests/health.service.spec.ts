import { HealthService } from '@/health/health.service'

function createService() {
  const prisma = {
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ ok: 1 }]),
  } as any
  const redis = {
    ping: jest.fn().mockResolvedValue('PONG'),
  } as any

  return {
    service: new HealthService(prisma, redis),
    prisma,
    redis,
  }
}

describe('healthService', () => {
  it('returns ok when database and redis are available', async () => {
    const { service } = createService()

    const result = await service.check()

    expect(result.status).toBe('ok')
    expect(result.dependencies.database.status).toBe('ok')
    expect(result.dependencies.redis.status).toBe('ok')
    expect(result.timestamp).toEqual(expect.any(String))
  })

  it('returns degraded when redis is unavailable', async () => {
    const { service, redis } = createService()
    redis.ping.mockRejectedValue(new Error('redis down'))

    const result = await service.check()

    expect(result.status).toBe('degraded')
    expect(result.dependencies.redis.status).toBe('error')
  })
})

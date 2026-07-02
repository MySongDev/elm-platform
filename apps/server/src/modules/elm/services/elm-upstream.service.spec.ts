import type { ConfigService } from '@nestjs/config'
import { BadGatewayException, Logger } from '@nestjs/common'
import { ElmUpstreamService } from './elm-upstream.service'

function createConfigService(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService
}

function createResponse(
  status: number,
  json: () => Promise<unknown>,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json,
  } as Response
}

describe('elm upstream service', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    jest.spyOn(Logger.prototype, 'error').mockImplementation()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('normalizes the base URL, serializes query values, and returns the upstream payload', async () => {
    const payload = { restaurants: [] }
    const fetchMock = jest.fn().mockResolvedValue(
      createResponse(200, async () => payload),
    )
    globalThis.fetch = fetchMock
    const service = new ElmUpstreamService(createConfigService({
      'elmApi.baseUrl': 'https://elm.example.test/',
      'elmApi.timeoutMs': 1000,
    }))

    const result = await service.get('/shopping/restaurants', {
      latitude: 31.23,
      longitude: '121.47',
      support_ids: [7, null, 9, undefined],
      keyword: '',
      category: null,
      offset: undefined,
    })

    expect(result).toBe(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://elm.example.test/shopping/restaurants?latitude=31.23&longitude=121.47&support_ids=7&support_ids=9&keyword=',
    )
    expect(init).toEqual(expect.objectContaining({
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: expect.any(AbortSignal),
    }))
  })

  it('converts a non-2xx response to BadGatewayException', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      createResponse(503, async () => ({ error: 'unavailable' })),
    )
    const service = new ElmUpstreamService(createConfigService({}))

    await expect(service.get('/shopping/restaurants'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
  })

  it('converts a network rejection to BadGatewayException', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('socket closed'))
    const service = new ElmUpstreamService(createConfigService({}))

    await expect(service.get('/shopping/restaurants'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
  })

  it('converts invalid upstream JSON to BadGatewayException', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      createResponse(200, async () => {
        throw new SyntaxError('Unexpected token')
      }),
    )
    const service = new ElmUpstreamService(createConfigService({}))

    await expect(service.get('/shopping/restaurants'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
  })

  it('aborts a timed-out request and converts AbortError to BadGatewayException', async () => {
    jest.useFakeTimers()
    globalThis.fetch = jest.fn((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      })
    }))
    const service = new ElmUpstreamService(createConfigService({
      'elmApi.timeoutMs': 25,
    }))

    const request = expect(service.get('/shopping/restaurants'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
    await jest.advanceTimersByTimeAsync(25)

    await request
  })
})

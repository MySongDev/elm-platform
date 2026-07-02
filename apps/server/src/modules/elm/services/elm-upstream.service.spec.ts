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

  it('rejects a protocol-relative path without calling fetch', async () => {
    const fetchMock = jest.fn()
    globalThis.fetch = fetchMock
    const service = new ElmUpstreamService(createConfigService({
      'elmApi.baseUrl': 'https://elm.example.test',
    }))

    await expect(service.get('///attacker.test/x'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['an invalid URL', 'not a url'],
    ['a non-HTTP URL', 'mailto:ops@elm.example.test'],
    ['a URL with query', 'https://elm.example.test?token=secret'],
    ['a URL with fragment', 'https://elm.example.test#internal'],
  ])('rejects %s base URL without calling fetch', async (_description, baseUrl) => {
    const fetchMock = jest.fn()
    globalThis.fetch = fetchMock
    const service = new ElmUpstreamService(createConfigService({
      'elmApi.baseUrl': baseUrl,
    }))

    await expect(service.get('/shopping/restaurants'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(Logger.prototype.error).toHaveBeenCalled()
  })

  it('preserves a valid base URL path prefix', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      createResponse(200, async () => ({ ok: true })),
    )
    globalThis.fetch = fetchMock
    const service = new ElmUpstreamService(createConfigService({
      'elmApi.baseUrl': 'https://elm.example.test/api/',
    }))

    await service.get('/shopping/restaurants')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://elm.example.test/api/shopping/restaurants',
      expect.any(Object),
    )
  })

  it('converts a non-2xx response to BadGatewayException', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined)
    globalThis.fetch = jest.fn().mockResolvedValue(
      {
        ...createResponse(503, async () => ({ error: 'unavailable' })),
        body: { cancel },
      } as unknown as Response,
    )
    const service = new ElmUpstreamService(createConfigService({}))

    await expect(service.get('/shopping/restaurants'))
      .rejects
      .toBeInstanceOf(BadGatewayException)
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('converts a network rejection to BadGatewayException', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('socket closed'))
    const service = new ElmUpstreamService(createConfigService({}))
    const path = '/shopping/restaurants'

    const error = await service.get(path).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(BadGatewayException)
    expect((error as BadGatewayException).message).toContain(path)
    expect((error as BadGatewayException).message).not.toContain('socket closed')
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining(path),
      expect.stringContaining('socket closed'),
    )
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

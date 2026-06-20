import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let createMockRouteRegistry, findMockRoute, normalizeMockPath

describe('route-registry', () => {
  beforeEach(async () => {
    vi.resetModules()
    const registryModule = await import('./route-registry.js')
    createMockRouteRegistry = registryModule.createMockRouteRegistry
    findMockRoute = registryModule.findMockRoute
    normalizeMockPath = registryModule.normalizeMockPath
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('normalizeMockPath', () => {
    it('removes trailing slash', () => {
      expect(normalizeMockPath('/v1/pois/')).toBe('/v1/pois')
    })

    it('returns root for empty path after normalization', () => {
      expect(normalizeMockPath('/')).toBe('/')
    })

    it('leaves paths without trailing slash unchanged', () => {
      expect(normalizeMockPath('/v1/pois')).toBe('/v1/pois')
    })
  })

  describe('createMockRouteRegistry', () => {
    it('rejects duplicate method and normalized path', () => {
      expect(() =>
        createMockRouteRegistry([
          {
            url: '/v1/pois',
            method: 'get',
            response: () => ({}),
          },
          {
            url: '/v1/pois/',
            method: 'GET',
            response: () => ({}),
          },
        ]),
      ).toThrow(/GET \/v1\/pois/)
    })

    it('rejects routes without an absolute url', () => {
      expect(() =>
        createMockRouteRegistry([
          {
            url: 'v1/pois',
            method: 'get',
            response: () => ({}),
          },
        ]),
      ).toThrow(/must start with/)
    })

    it('rejects routes without a response function', () => {
      expect(() =>
        createMockRouteRegistry([
          {
            url: '/v1/pois',
            method: 'get',
          },
        ]),
      ).toThrow(/response must be a function/)
    })

    it('defaults method to GET when not provided', () => {
      const registry = createMockRouteRegistry([
        {
          url: '/test',
          response: () => ({ ok: true }),
        },
      ])
      expect(registry[0].method).toBe('GET')
    })

    it('normalizes method to uppercase', () => {
      const registry = createMockRouteRegistry([
        {
          url: '/test',
          method: 'post',
          response: () => ({}),
        },
      ])
      expect(registry[0].method).toBe('POST')
    })
  })

  describe('findMockRoute', () => {
    it('matches trailing slash and extracts dynamic params', () => {
      const registry = createMockRouteRegistry([
        {
          url: '/shops/:shopId/reviews',
          method: 'get',
          response: ({ params }) => ({ shopId: params.shopId }),
        },
      ])

      const result = findMockRoute(registry, 'GET', '/shops/42/reviews/')
      expect(result).not.toBeNull()
      expect(result.params.shopId).toBe('42')
    })

    it('returns null when no route matches', () => {
      const registry = createMockRouteRegistry([
        {
          url: '/v1/pois',
          method: 'get',
          response: () => ({}),
        },
      ])

      const result = findMockRoute(registry, 'GET', '/v1/unknown')
      expect(result).toBeNull()
    })

    it('returns null when method does not match', () => {
      const registry = createMockRouteRegistry([
        {
          url: '/v1/pois',
          method: 'get',
          response: () => ({}),
        },
      ])

      const result = findMockRoute(registry, 'POST', '/v1/pois')
      expect(result).toBeNull()
    })

    it('decodes dynamic params', () => {
      const registry = createMockRouteRegistry([
        {
          url: '/items/:name',
          method: 'get',
          response: ({ params }) => ({ name: params.name }),
        },
      ])

      const result = findMockRoute(registry, 'GET', '/items/hello%20world')
      expect(result).not.toBeNull()
      expect(result.params.name).toBe('hello world')
    })
  })
})

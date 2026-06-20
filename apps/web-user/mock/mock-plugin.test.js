import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let createWebUserMockPlugin

describe('web-user mock plugin', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  function createTestServer() {
    const middlewares = []
    const server = {
      config: { logger: { info: vi.fn() } },
      middlewares: {
        use: vi.fn(handler => middlewares.push(handler)),
      },
    }

    return {
      server,
      middlewares,
    }
  }

  function createTestResponse() {
    const response = {
      statusCode: 0,
      headers: {},
      body: '',
      setHeader(name, value) {
        this.headers[name] = value
      },
      end(data) {
        this.body = data
      },
    }
    return response
  }

  it('returns 200 JSON for matched routes', async () => {
    vi.doMock('./routes.js', () => ({
      webUserMockRoutes: [],
    }))
    const { createWebUserMockPlugin } = await import('./mock-plugin.js')
    const { server, middlewares } = createTestServer()

    const plugin = createWebUserMockPlugin({
      enable: true,
      routes: [{
        url: '/mock/:id',
        method: 'get',
        response: ({ params }) => ({ id: params.id }),
      }],
    })

    plugin.configureServer(server)

    const response = createTestResponse()
    const next = vi.fn()

    await middlewares[0](
      {
        url: '/mock/123?foo=bar',
        method: 'GET',
      },
      response,
      next,
    )

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ id: '123' })
    expect(next).not.toHaveBeenCalled()
  })

  it('adds X-Elm-Mock header on matched responses', async () => {
    vi.doMock('./routes.js', () => ({
      webUserMockRoutes: [],
    }))
    const { createWebUserMockPlugin } = await import('./mock-plugin.js')
    const { server, middlewares } = createTestServer()

    const plugin = createWebUserMockPlugin({
      enable: true,
      routes: [{
        url: '/test',
        method: 'get',
        response: () => ({ ok: true }),
      }],
    })

    plugin.configureServer(server)

    const response = createTestResponse()
    const next = vi.fn()

    await middlewares[0](
      {
        url: '/test',
        method: 'GET',
      },
      response,
      next,
    )

    expect(response.headers['X-Elm-Mock']).toBe('web-user')
    expect(response.headers['Content-Type']).toBe('application/json; charset=utf-8')
  })

  it('calls next() once for unmatched routes', async () => {
    vi.doMock('./routes.js', () => ({
      webUserMockRoutes: [],
    }))
    const { createWebUserMockPlugin } = await import('./mock-plugin.js')
    const { server, middlewares } = createTestServer()

    const plugin = createWebUserMockPlugin({
      enable: true,
      routes: [{
        url: '/test',
        method: 'get',
        response: () => ({}),
      }],
    })

    plugin.configureServer(server)

    const response = createTestResponse()
    const next = vi.fn()

    await middlewares[0](
      {
        url: '/unknown',
        method: 'GET',
      },
      response,
      next,
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBe(0)
  })

  it('returns 500 JSON when async handler throws', async () => {
    vi.doMock('./routes.js', () => ({
      webUserMockRoutes: [],
    }))
    const { createWebUserMockPlugin } = await import('./mock-plugin.js')
    const { server, middlewares } = createTestServer()

    const plugin = createWebUserMockPlugin({
      enable: true,
      routes: [{
        url: '/error',
        method: 'get',
        response: async () => { throw new Error('boom') },
      }],
    })

    plugin.configureServer(server)

    const response = createTestResponse()
    const next = vi.fn()

    await middlewares[0](
      {
        url: '/error',
        method: 'GET',
      },
      response,
      next,
    )

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({
      code: 500,
      message: 'Mock handler failed',
    })
    expect(next).not.toHaveBeenCalled()
  })
})

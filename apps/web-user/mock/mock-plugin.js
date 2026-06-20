import { createMockRouteRegistry, findMockRoute } from './route-registry.js'
import { webUserMockRoutes } from './routes.js'

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('X-Elm-Mock', 'web-user')
  response.end(JSON.stringify(payload))
}

export function createWebUserMockPlugin(options = {}) {
  const routes = options.routes || webUserMockRoutes
  const registry = createMockRouteRegistry(routes)

  return {
    name: 'elm-web-user-local-mock',
    configureServer(server) {
      if (!options.enable)
        return

      server.config.logger.info(`[web-user mock] enabled ${registry.length} routes`)
      server.middlewares.use(async (request, response, next) => {
        if (!request.url || !request.method) {
          next()
          return
        }

        const url = new URL(request.url, 'http://localhost')
        const match = findMockRoute(registry, request.method, url.pathname)
        if (!match) {
          next()
          return
        }

        try {
          const payload = await match.route.response({
            params: match.params,
            query: Object.fromEntries(url.searchParams.entries()),
            url: request.url,
          })
          sendJson(response, 200, payload)
        }
        catch {
          sendJson(response, 500, {
            code: 500,
            message: 'Mock handler failed',
          })
        }
      })
    },
  }
}

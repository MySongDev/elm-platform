import addressRoutes from './address.js'
import indexRoutes from './index.js'
import poisRoutes from './pois.js'
import searchRoutes from './search.js'
import shopReviewRoutes from './shopreviews.js'

const routes = [
  ...addressRoutes,
  ...indexRoutes,
  ...poisRoutes,
  ...searchRoutes,
  ...shopReviewRoutes,
]

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/'
}

function createRouteMatcher(routeUrl) {
  const routeParts = normalizePath(routeUrl).split('/')

  return (pathname) => {
    const pathnameParts = normalizePath(pathname).split('/')

    if (routeParts.length !== pathnameParts.length) {
      return false
    }

    return routeParts.every((part, index) => part.startsWith(':') || part === pathnameParts[index])
  }
}

function sendJson(response, payload) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

export function createWebUserMockPlugin(options = {}) {
  const routeMatchers = routes.map(route => ({
    ...route,
    matches: createRouteMatcher(route.url),
    method: route.method.toUpperCase(),
  }))

  return {
    name: 'elm-web-user-local-mock',
    configureServer(server) {
      if (!options.enable) {
        return
      }

      server.middlewares.use((request, response, next) => {
        if (!request.url || !request.method) {
          next()
          return
        }

        const url = new URL(request.url, 'http://localhost')
        const route = routeMatchers.find(item =>
          item.method === request.method?.toUpperCase()
          && item.matches(url.pathname),
        )

        if (!route) {
          next()
          return
        }

        const query = Object.fromEntries(url.searchParams.entries())
        const payload = route.response({
          query,
          url: request.url,
        })
        sendJson(response, payload)
      })
    },
  }
}

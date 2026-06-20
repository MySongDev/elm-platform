export function normalizeMockPath(pathname) {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

function compileMatcher(routePath) {
  const routeParts = normalizeMockPath(routePath).split('/')

  return (pathname) => {
    const pathnameParts = normalizeMockPath(pathname).split('/')
    if (routeParts.length !== pathnameParts.length)
      return null

    const params = {}
    for (let index = 0; index < routeParts.length; index += 1) {
      const routePart = routeParts[index]
      const pathnamePart = pathnameParts[index]
      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = decodeURIComponent(pathnamePart)
      }
      else if (routePart !== pathnamePart) {
        return null
      }
    }
    return params
  }
}

export function createMockRouteRegistry(routes) {
  const seen = new Set()

  return routes.map((route) => {
    if (typeof route.url !== 'string' || !route.url.startsWith('/'))
      throw new TypeError('[web-user mock] route url must start with "/"')
    if (typeof route.response !== 'function')
      throw new TypeError(`[web-user mock] ${route.url} response must be a function`)

    const url = normalizeMockPath(route.url)
    const method = String(route.method || 'get').toUpperCase()
    const key = `${method} ${url}`
    if (seen.has(key))
      throw new Error(`[web-user mock] duplicate route: ${key}`)
    seen.add(key)

    return {
      ...route,
      url,
      method,
      match: compileMatcher(url),
    }
  })
}

export function findMockRoute(registry, method, pathname) {
  const normalizedMethod = String(method).toUpperCase()
  for (const route of registry) {
    if (route.method !== normalizedMethod)
      continue
    const params = route.match(pathname)
    if (params) {
      return {
        route,
        params,
      }
    }
  }
  return null
}

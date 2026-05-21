import type { RouteRecordRaw } from 'vue-router'

export function flattenRoutes(routes: RouteRecordRaw[], parentPath = ''): RouteRecordRaw[] {
  const flatRoutes: RouteRecordRaw[] = []

  routes.forEach((route) => {
    const currentPath = parentPath + route.path
    const flatRoute: RouteRecordRaw = {
      ...route,
      path: currentPath,
      children: undefined,
      meta: {
        ...route.meta,
        flatPath: currentPath,
        originalPath: route.path,
      },
    }

    flatRoutes.push(flatRoute)

    if (route.children) {
      flatRoutes.push(...flattenRoutes(route.children as RouteRecordRaw[], currentPath))
    }
  })

  return flatRoutes
}

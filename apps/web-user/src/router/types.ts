import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    keepAlive?: boolean
    hideLayoutHeader?: boolean
    flatPath?: string
    originalPath?: string
  }
}

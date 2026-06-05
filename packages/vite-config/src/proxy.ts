import type { ProxyOptions } from 'vite'

export interface ApiProxyOptions {
  target?: string
  prefixes?: Record<string, {
    target?: string
    rewrite?: (path: string) => string
  }>
}

export function createApiProxy(options: ApiProxyOptions = {}): Record<string, ProxyOptions> {
  const target = options.target ?? 'http://127.0.0.1:3000'

  const proxy: Record<string, ProxyOptions> = {
    '/api': {
      target,
      changeOrigin: true,
    },
  }

  if (options.prefixes) {
    for (const [prefix, config] of Object.entries(options.prefixes)) {
      proxy[prefix] = {
        target: config.target ?? target,
        changeOrigin: true,
        ...(config.rewrite && { rewrite: config.rewrite }),
      }
    }
  }

  return proxy
}

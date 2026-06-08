import { addErrorLog } from '@/untils/logger'

const ROUTE_START_MARK = '__route_start_time__'
const PERFORMANCE_REPORTED = '__performance_reported__'
const LONG_TASK_MIN_DURATION = 50

function safeStringify(value) {
  try {
    return JSON.stringify(value)
  }
  catch {
    return '[unserializable]'
  }
}

function normalizeError(error) {
  if (!error) {
    return {
      name: 'UnknownError',
      message: 'Unknown error',
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    }
  }

  return {
    name: error.name || 'Error',
    message: error.message || safeStringify(error),
    stack: error.stack,
  }
}

function getCurrentRoute(router) {
  const route = router?.currentRoute?.value

  if (!route)
    return undefined

  return {
    name: route.name,
    path: route.path,
    fullPath: route.fullPath,
    title: route.meta?.title,
  }
}

function reportError(type, error, extra = {}) {
  addErrorLog({
    type,
    ...normalizeError(error),
    ...extra,
  })
}

function setupGlobalErrorMonitor(app, router) {
  app.config.errorHandler = (error, instance, info) => {
    reportError('vue_error', error, {
      info,
      componentName: instance?.type?.name || instance?.type?.__name,
      route: getCurrentRoute(router),
    })

    console.error('[vue_error]', error)
  }

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target

      if (target && target !== window) {
        const tagName = target.tagName?.toLowerCase()
        const url = target.currentSrc || target.src || target.href

        if (tagName && url) {
          addErrorLog({
            type: 'resource_error',
            tagName,
            url,
            outerHTML: target.outerHTML,
            route: getCurrentRoute(router),
          })
          return
        }
      }

      reportError('js_error', event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        route: getCurrentRoute(router),
      })
    },
    true,
  )

  window.addEventListener('unhandledrejection', (event) => {
    reportError('promise_error', event.reason, {
      route: getCurrentRoute(router),
    })
  })
}

function setupRouterMonitor(router) {
  if (!router)
    return

  router.beforeEach((to, _from, next) => {
    to.meta[ROUTE_START_MARK] = performance.now()
    next()
  })

  router.afterEach((to, from, failure) => {
    const start = to.meta[ROUTE_START_MARK]
    const durationMs = typeof start === 'number' ? Math.round(performance.now() - start) : undefined

    addErrorLog({
      type: 'page_view',
      from: from.fullPath,
      to: to.fullPath,
      name: to.name,
      title: to.meta?.title,
      durationMs,
      isNotFound: to.name === 'NotFound' || to.path === '/404',
      failed: Boolean(failure),
      failureMessage: failure?.message,
    })
  })

  router.onError((error, to, from) => {
    reportError('route_error', error, {
      from: from?.fullPath,
      to: to?.fullPath,
    })
  })
}

function getNavigationTiming() {
  const [navigation] = performance.getEntriesByType?.('navigation') || []

  if (navigation) {
    return {
      type: navigation.type,
      durationMs: Math.round(navigation.duration),
      redirectMs: Math.round(navigation.redirectEnd - navigation.redirectStart),
      dnsMs: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
      tcpMs: Math.round(navigation.connectEnd - navigation.connectStart),
      requestMs: Math.round(navigation.responseStart - navigation.requestStart),
      responseMs: Math.round(navigation.responseEnd - navigation.responseStart),
      domInteractiveMs: Math.round(navigation.domInteractive),
      domContentLoadedMs: Math.round(
        navigation.domContentLoadedEventEnd - navigation.startTime,
      ),
      loadMs: Math.round(navigation.loadEventEnd - navigation.startTime),
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize,
    }
  }

  const timing = performance.timing
  if (!timing)
    return undefined

  return {
    durationMs: timing.loadEventEnd - timing.navigationStart,
    dnsMs: timing.domainLookupEnd - timing.domainLookupStart,
    tcpMs: timing.connectEnd - timing.connectStart,
    requestMs: timing.responseStart - timing.requestStart,
    responseMs: timing.responseEnd - timing.responseStart,
    domInteractiveMs: timing.domInteractive - timing.navigationStart,
    domContentLoadedMs: timing.domContentLoadedEventEnd - timing.navigationStart,
    loadMs: timing.loadEventEnd - timing.navigationStart,
  }
}

function setupPerformanceMonitor(router) {
  const reportNavigation = () => {
    if (window[PERFORMANCE_REPORTED])
      return

    window[PERFORMANCE_REPORTED] = true

    setTimeout(() => {
      addErrorLog({
        type: 'performance_navigation',
        timing: getNavigationTiming(),
        route: getCurrentRoute(router),
      })
    }, 0)
  }

  if (document.readyState === 'complete')
    reportNavigation()
  else
    window.addEventListener('load', reportNavigation, { once: true })

  if (!('PerformanceObserver' in window))
    return

  try {
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        addErrorLog({
          type: 'performance_paint',
          name: entry.name,
          startTimeMs: Math.round(entry.startTime),
          route: getCurrentRoute(router),
        })
      }
    })
    paintObserver.observe({
      type: 'paint',
      buffered: true,
    })
  }
  catch {}

  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < LONG_TASK_MIN_DURATION)
          continue

        addErrorLog({
          type: 'performance_long_task',
          durationMs: Math.round(entry.duration),
          startTimeMs: Math.round(entry.startTime),
          route: getCurrentRoute(router),
        })
      }
    })
    longTaskObserver.observe({
      type: 'longtask',
      buffered: true,
    })
  }
  catch {}
}

export function setupMonitor(app, router) {
  if (typeof window === 'undefined' || !app)
    return

  setupGlobalErrorMonitor(app, router)
  setupRouterMonitor(router)
  setupPerformanceMonitor(router)
}

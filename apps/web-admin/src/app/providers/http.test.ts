import type { HttpClientOptions } from '@/shared/api/http'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupHttpClient } from './http'

let capturedOptions: HttpClientOptions

const { authStore, router } = vi.hoisted(() => ({
  authStore: {
    token: 'valid-token',
    ensureSessionValid: vi.fn(() => true),
    resetToken: vi.fn(),
  },
  router: {
    currentRoute: {
      value: {
        path: '/account/settings',
        fullPath: '/account/settings?pane=securityLog&from=notice',
        meta: { requiresAuth: true },
      },
    },
    replace: vi.fn(),
    push: vi.fn(),
  },
}))

vi.mock('@/shared/api/request', () => ({
  configureHttpClient: vi.fn((options: HttpClientOptions) => {
    capturedOptions = options
  }),
}))

vi.mock('@/entities/session', () => ({
  useAuthStore: () => authStore,
}))

vi.mock('@/app/router', () => ({
  default: router,
}))

vi.mock('@/shared/i18n', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
  },
}))

describe('setupHttpClient unauthorized redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    router.currentRoute.value = {
      path: '/account/settings',
      fullPath: '/account/settings?pane=securityLog&from=notice',
      meta: { requiresAuth: true },
    }
    setupHttpClient()
  })

  it('keeps the full current route as a login redirect query value', () => {
    capturedOptions.onUnauthorized?.()

    expect(authStore.resetToken).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith({
      path: '/login',
      query: {
        redirect: '/account/settings?pane=securityLog&from=notice',
      },
    })
    expect(router.push).not.toHaveBeenCalled()
  })

  it('does not redirect again when the current route is public', () => {
    router.currentRoute.value = {
      path: '/login',
      fullPath: '/login?redirect=/account/settings',
      meta: { requiresAuth: false },
    }

    capturedOptions.onUnauthorized?.()

    expect(authStore.resetToken).toHaveBeenCalledTimes(1)
    expect(router.replace).not.toHaveBeenCalled()
  })
})

import type { MockMethod } from 'vite-plugin-mock'
import type { UpdateProfileParams } from '../../src/entities/session/model/types'
import {
  createDevMockLoginResult,
  createDevMockUserInfo,
  DEV_MOCK_TIMESTAMP,
  getDevMockUserMenus,
} from '../fixtures/session'
import { sharedNotificationMockState } from '../state/notification-state'

function success<T>(data: T) {
  return {
    code: 200,
    data,
    message: 'success',
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeProfilePatch(body: unknown): UpdateProfileParams {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return {}
  const value = body as Record<string, unknown>
  return {
    ...(typeof value.username === 'string' ? { username: value.username } : {}),
    ...(typeof value.email === 'string' || value.email === null ? { email: value.email } : {}),
    ...(typeof value.phone === 'string' || value.phone === null ? { phone: value.phone } : {}),
  }
}

export function createAuthMockRoutes(): MockMethod[] {
  let currentUser = createDevMockUserInfo()

  return [
    {
      url: '/api/auth/login',
      method: 'post',
      response: ({ body, headers }) => {
        const credentials = body && typeof body === 'object'
          ? body as {
            account?: string
            rememberMe?: boolean
          }
          : {}
        const result = createDevMockLoginResult(
          credentials.account || 'dev-admin',
          credentials.rememberMe,
        )
        currentUser = { ...result.user }
        const userAgent = (headers?.['user-agent'] as string | undefined) || ''
        const browser = userAgent.includes('Firefox')
          ? 'Firefox'
          : userAgent.includes('Edg')
            ? 'Edge'
            : userAgent.includes('Chrome')
              ? 'Chrome'
              : '未知浏览器'
        const os = userAgent.includes('Windows')
          ? 'Windows'
          : userAgent.includes('Mac OS') || userAgent.includes('Macintosh')
            ? 'macOS'
            : userAgent.includes('Linux')
              ? 'Linux'
              : '未知系统'
        sharedNotificationMockState.addSecurityLoginNotification({
          ip: '127.0.0.1',
          browser,
          os,
        })
        return success(result)
      },
    },
    {
      url: '/api/auth/profile',
      method: 'get',
      response: () => success({ ...currentUser }),
    },
    {
      url: '/api/auth/profile',
      method: 'patch',
      response: ({ body }) => {
        currentUser = {
          ...currentUser,
          ...normalizeProfilePatch(body),
          updatedAt: DEV_MOCK_TIMESTAMP,
        }
        return success({ ...currentUser })
      },
    },
    {
      url: '/api/auth/menus',
      method: 'get',
      response: () => success(getDevMockUserMenus()),
    },
    {
      url: '/api/auth/security-logs',
      method: 'get',
      response: ({ query }) => success({
        list: [],
        total: 0,
        page: normalizePositiveInteger(query?.page, 1),
        pageSize: normalizePositiveInteger(query?.pageSize, 10),
      }),
    },
  ]
}

export default createAuthMockRoutes()

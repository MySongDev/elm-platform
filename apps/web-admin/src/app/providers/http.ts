/**
 * @file HTTP 客户端应用适配器
 * @domain app/providers
 * @description 有副作用：把认证状态、路由跳转、i18n 文案和 Element Plus 提示注入共享 HTTP 客户端。
 */

import { ElMessage } from 'element-plus'
import router from '@/app/router'
import { useAuthStore } from '@/entities/session'
import { configureHttpClient } from '@/shared/api/request'
import { LOGIN_PATH } from '@/shared/config/paths'
import i18n from '@/shared/i18n'

const t = i18n.global.t as (key: string) => string

export function setupHttpClient() {
  configureHttpClient({
    getToken: () => {
      const authStore = useAuthStore()
      return authStore.ensureSessionValid() ? authStore.token : ''
    },
    onUnauthorized: () => {
      const authStore = useAuthStore()
      const currentRoute = router.currentRoute.value
      authStore.resetToken()

      if (currentRoute.meta.requiresAuth === false || currentRoute.path === LOGIN_PATH)
        return

      router.replace({
        path: LOGIN_PATH,
        query: { redirect: currentRoute.fullPath },
      })
    },
    onForbidden: (message?: string) => {
      const tenantMessage = parseTenantErrorMessage(message)
      ElMessage.error(tenantMessage || t('request.noPermission'))
      if (!tenantMessage)
        router.push('/403')
    },
    onError: message => ElMessage.error(message || t('request.networkError')),
  })
}

const TENANT_ERROR_MESSAGES: Record<string, string> = {
  TENANT_PENDING: '当前租户正在审核中，暂无法使用业务功能。',
  TENANT_SUSPENDED_READONLY: '当前租户已暂停，仅可查看数据，请联系平台管理员。',
  TENANT_DISABLED: '当前租户已被禁用，请联系平台管理员。',
  TENANT_EXPIRED_READONLY: '当前租户已过期，仅可查看数据，请联系平台管理员续期。',
  TENANT_ARCHIVED: '当前租户已归档，请联系平台管理员。',
}

function parseTenantErrorMessage(message?: string): string | undefined {
  if (!message)
    return undefined
  for (const [code, text] of Object.entries(TENANT_ERROR_MESSAGES)) {
    if (message.includes(code))
      return text
  }
  return undefined
}

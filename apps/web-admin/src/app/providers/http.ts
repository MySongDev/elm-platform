/**
 * @file HTTP 客户端应用适配器
 * @domain app/providers
 * @description 有副作用：把认证状态、路由跳转、i18n 文案和 Element Plus 提示注入共享 HTTP 客户端。
 */

import { ElMessage } from 'element-plus'
import router from '@/app/router'
import { useAuthStore } from '@/entities/session'
import { configureHttpClient } from '@/shared/api/request'
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
      authStore.resetToken()
      router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
    },
    onForbidden: () => {
      ElMessage.error(t('request.noPermission'))
      router.push('/403')
    },
    onError: message => ElMessage.error(message || t('request.networkError')),
  })
}

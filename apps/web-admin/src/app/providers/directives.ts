/**
 * @file 应用指令注册器
 * @domain app/providers
 * @description 有副作用：注册全局 v-auth 指令，根据当前用户权限移除无权限操作入口。
 */

import type { App, Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/entities/session'

function checkPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const authStore = useAuthStore()
  const requiredPerms = binding.value

  if (!requiredPerms)
    return

  const hasAuth = authStore.hasPermission(requiredPerms)
  if (!hasAuth) {
    el.parentNode?.removeChild(el)
  }
}

const authDirective: Directive<HTMLElement, string | string[]> = {
  mounted: checkPermission,
  updated: checkPermission,
}

export function setupDirectives(app: App) {
  app.directive('auth', authDirective)
}

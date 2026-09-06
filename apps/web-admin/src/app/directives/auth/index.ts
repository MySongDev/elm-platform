/**
 * @file auth 权限指令
 * @domain app/directives
 * @description 定义全局 v-auth 指令：根据当前用户权限移除无权限操作入口。
 */

import type { DirectiveBinding } from 'vue'
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
export default {
  name: 'auth',
  mounted: checkPermission,
  updated: checkPermission,
}

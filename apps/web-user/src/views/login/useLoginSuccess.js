import { useRoute, useRouter } from 'vue-router'

import { useUserStore } from '@/stores/modules/store-user'

/**
 * 登录成功后的统一收尾：短信登录与密码登录共用，差异只在前面调哪个接口。
 * 仅服务 login 文件夹内的两个页面，故就近放在此处而非全局 composables。
 */
export function useLoginSuccess() {
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  // 仅接受站内绝对路径作为回跳目标，否则回落首页，杜绝开放重定向
  function resolveRedirectTarget() {
    const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
    if (typeof redirect !== 'string' || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/login'))
      return '/msite'

    return redirect
  }

  // 把响应里的令牌/资料落地为登录态，再跳回用户原本想去的页面
  function completeLogin(response) {
    userStore.recordUserInfo(response)
    router.replace(resolveRedirectTarget())
  }

  return { completeLogin }
}

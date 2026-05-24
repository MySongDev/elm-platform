import piniaPersist from 'pinia-plugin-persistedstate'

import { createApp } from 'vue'
import BaseState from '@/components/common/BaseState/BaseState.vue'
import SmartImage from '@/components/common/SmartImage.vue'
import FootGuide from '@/components/footer/footGuide.vue'
import HeadTop from '@/components/header/head.vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import { setupMonitor } from '@/monitor'
import router from '@/router'
import { setUnauthorizedHandler } from '@/services/http/http'
import { pinia, registStore } from '@/stores'
import { useUserStore } from '@/stores/modules/store-user'

import { setStore } from '@/untils/storage'
import App from './App.vue'
import lazy from './directives/lazy'

import 'virtual:svg-icons-register'

const app = createApp(App)

setupMonitor(app, router)

app.use(router)

registStore(app)

setUnauthorizedHandler(() => {
  const userStore = useUserStore(pinia)
  userStore.logout()
  if (router.currentRoute.value.path !== '/login') {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
})

pinia.use(piniaPersist)
pinia.use(({ store }) => {
  store.$subscribe((mutation, state) => {
    setStore(store.$id, state)
  })
})

// 指令
app.directive('lazy', lazy)

// 全局组件
app.component('FootGuide', FootGuide) // 底部组件
app.component('HeadTop', HeadTop) // 头部组件
app.component('SvgIcon', SvgIcon) // SVG
app.component('BaseState', BaseState)
app.component('SmartImage', SmartImage)

app.mount('#app')

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import { setupDirectives } from '@/app/providers/directives'
import { setupHttpClient } from '@/app/providers/http'
import router from '@/app/router'
import { setupI18n } from '@/shared/i18n'
import SvgIcon from '@/shared/ui/SvgIcon/index.vue'
import App from './App.vue'
import '@/shared/styles/tokens.scss'
import 'virtual:svg-icons-register'
import 'element-plus/dist/index.css'
import 'nprogress/nprogress.css'
import '@/shared/styles/global.scss'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
setupHttpClient()
app.use(router)
setupI18n(app)
setupDirectives(app)
app.component('SvgIcon', SvgIcon)
app.mount('#app')

/**
 * @file 国际化运行时
 * @domain shared/i18n
 * @description 集中创建 vue-i18n 实例、Element Plus 语言包合并和语言偏好持久化入口。
 */

import type { App, WritableComputedRef } from 'vue'
import type { I18n } from 'vue-i18n'
import enLocale from 'element-plus/es/locale/lang/en'
import zhLocale from 'element-plus/es/locale/lang/zh-cn'
import { createI18n } from 'vue-i18n'
import en from './lang/en'
import zhCN from './lang/zh-CN'

const localesConfigs = {
  'zh-CN': { ...zhCN, ...zhLocale },
  'en': { ...en, ...enLocale },
}

function getStoredLocale() {
  return globalThis.localStorage?.getItem?.('locale') || 'zh-CN'
}

function setStoredLocale(locale: string) {
  globalThis.localStorage?.setItem?.('locale', locale)
}

const i18n: I18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'zh-CN',
  messages: localesConfigs,
})

/**
 * @description 有副作用：将共享 i18n 实例安装到 Vue 应用，必须在组件渲染前调用。
 * @param app 当前 Vue 应用实例。
 */
export function setupI18n(app: App) {
  app.use(i18n)
}

/**
 * @description 为静态配置保留 i18n key；这些配置会在运行时由展示层统一翻译。
 * @param key i18n key。
 * @returns 原始 i18n key。
 */
export function $t(key: string): string {
  return key
}

/**
 * @description 在路由守卫、hooks 等非组件环境执行运行时翻译；对象消息按当前 locale 取值。
 * @param message i18n key、locale 文案对象或空值。
 * @returns 当前语言下的展示文案。
 */
export function transformI18n(message: any = ''): string {
  if (!message)
    return ''

  if (typeof message === 'object') {
    const locale = i18n.global.locale as string | WritableComputedRef<string>
    const localeValue = typeof locale === 'string' ? locale : locale.value
    return message[localeValue] ?? ''
  }

  const key = String(message)
  const exists = i18n.global.te as (key: string) => boolean
  if (!exists(key))
    return key

  return (i18n.global.t as (key: string) => string)(key)
}

/**
 * @description 有副作用：提供读取和更新当前语言的方法，更新语言时会同步写入 localStorage。
 * @returns 当前语言的 getter 与 setter。
 */
export function useLocale() {
  function setLocale(locale: string) {
    const currentLocale = i18n.global.locale as string | WritableComputedRef<string>
    if (typeof currentLocale !== 'string')
      currentLocale.value = locale
    setStoredLocale(locale)
  }

  function getLocale() {
    const currentLocale = i18n.global.locale as string | WritableComputedRef<string>
    return typeof currentLocale === 'string' ? currentLocale : currentLocale.value
  }

  return { setLocale, getLocale }
}

export default i18n

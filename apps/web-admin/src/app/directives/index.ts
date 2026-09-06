/**
 * @file 指令自动注册插件
 * @domain app/directives
 * @description 有副作用：通过 import.meta.glob 收集 directives 子目录中的 index.ts，以 Vue 插件形式统一注册全局指令。
 */

import type { App, Directive } from 'vue'

interface DirectiveModule {
  default: { name: string } & Directive
}

const modules = import.meta.glob<DirectiveModule>('./*/index.ts', {
  eager: true,
})

export default {
  install(app: App) {
    Object.values(modules).forEach(({ default: item }) => {
      app.directive(item.name, item)
    })
  },
}

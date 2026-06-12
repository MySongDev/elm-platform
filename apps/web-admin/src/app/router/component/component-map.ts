/**
 * @file 路由组件映射
 * @domain router
 * @description 通过 Vite glob 建立页面组件索引，集中处理后端 component key 与本地页面文件的约定。
 */

const modules = import.meta.glob('../../pages/**/index.vue')
const layoutComponent = () => import('@/layouts/index.vue')

/**
 * @description 解析菜单 component key 对应的懒加载页面；找不到页面时回退到 404，避免动态菜单让路由注册失败。
 * @param key 后端下发或路径推导出的页面组件键，例如 `commerce/restaurant`。
 * @returns Vue Router 可使用的懒加载组件。
 */
export function resolveComponent(key: string | undefined) {
  if (!key)
    return layoutComponent

  const path = `../../pages/${key}/index.vue`
  const component = modules[path]

  if (!component && import.meta.env.DEV) {
    console.warn(`[router] Component not found for key "${key}". Expected: ${path}`)
  }

  return component ?? (() => import('@/pages/error/404.vue'))
}

export { layoutComponent }

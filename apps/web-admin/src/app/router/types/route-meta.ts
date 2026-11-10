/**
 * @file Vue Router Meta 类型扩展
 * @domain app/router
 * @description 为路由 meta 补充菜单、权限、缓存和标签页相关字段，约束动态路由与布局组件之间的协议。
 */

import type { Role } from '@/shared/config/access'
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * 标题，同时是 i18n 键：订阅方都走 transformI18n，所以既能给翻译键也能给语言包映射。
     * 缺省时标签页不会生成（entities/tab/model/store.ts 的 addTab 会提前 return），
     * document.title 却有兜底——出现「页面能进、标签栏没这一页」时先查这里。
     */
    title?: string | Record<string, string>
    icon?: string
    /**
     * 只管侧边栏 / 面包屑 / 全局搜索是否出现（SidebarItem、Breadcrumb、flatten-menu 读它），
     * 不影响标签页；要「不进标签页」用 hiddenTag。
     */
    hidden?: boolean
    /** 判据是 `!== false`：不写就是需要登录，只有显式写 false 才是公开路由。 */
    requiresAuth?: boolean
    /** 命中任意一个即通过（includes）；与 auths 之间是「且」，见 shared/lib/permission.ts 的 canAccessRoute。 */
    roles?: Role[]
    /** 必须全部命中才通过（hasPermission 用 every）；空数组按「未配置」放行。 */
    auths?: string[]
    /** 默认缓存，只有显式写 false 才关闭（entities/tab/model/lib.ts 的 resolveCacheName 判 `=== false`）。 */
    keepAlive?: boolean
    /**
     * 必须与页面组件 defineOptions({ name }) 完全一致：它最终进 <keep-alive :include>，
     * 而 include 匹配的是组件自身 name，对不上就静默不缓存、不报错。缺省时回退到路由 name。
     */
    cacheName?: string
    /** 页签去重键默认是 fullPath（query 不同算两个页签），这里可覆盖它，把多个 URL 合并成一个页签。 */
    tabKey?: string
    /** 只有一个子路由时默认降级为单个菜单项，打开它才保留父级展开结构。 */
    alwaysShow?: boolean
    /** 同级排序键，缺省按 99 处理；动态路由排序与 redirect 指向的首个子路由都依赖它。 */
    order?: number
    /** 不进标签页，页面本身仍可正常访问。 */
    hiddenTag?: boolean
    /** 固定页签：「关闭当前」等标签命令对它置灰（TabBar/model/tabCommands.ts）。 */
    fixedTag?: boolean
    /** 侧边栏高亮路径，让详情页高亮它的列表页（Sidebar/composables/useSidebarMenu.ts）。 */
    activePath?: string
  }
}

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
     * 本身也是 i18n 键，订阅方统一走 transformI18n 翻译（TabBar、面包屑、Sidebar、document.title）。
     * 缺省时页签不生成（addTab 判 `!title` 直接 return），只有 document.title 有兜底——
     * 看到「页面能进、标签栏没这一页」就从这里查。对象形式（按语言给文案）无人用，别依赖。
     */
    title?: string | Record<string, string>
    icon?: string
    /**
     * 只管侧边栏 / 面包屑 / 全局搜索显不显示（SidebarItem、Breadcrumb、flatten-menu 读它），
     * 不影响标签页；要「不进标签页」用 hiddenTag，别用 hidden。
     */
    hidden?: boolean
    /** 判据是 `!== false`：不写就是需登录，只有显式 false 才是公开路由（authGuard / dynamicRouteGuard / http.ts 都这么判）。 */
    requiresAuth?: boolean
    /** 命中任意一个即通过（includes）；与 auths 是「且」，见 shared/lib/permission.ts 的 canAccessRoute。 */
    roles?: Role[]
    /** 必须全部命中才通过（hasPermission 用 every）；空数组按「没配」放行。 */
    auths?: string[]
    /** 默认缓存，只有显式 false 才关（tab/model/lib.ts 的 resolveCacheName 判 `=== false`）。 */
    keepAlive?: boolean
    /**
     * 必须和页面组件 defineOptions({ name }) 完全一致：它最终进 <keep-alive :include>，
     * 而 include 匹配的是组件自身的 name，对不上就悄悄不缓存、也不报错。缺省时回退到路由 name。
     */
    cacheName?: string
    /** 页签去重默认用 fullPath（query 不同算两个页签），这里可覆盖，把多个 URL 合并成一个页签。 */
    tabKey?: string
    /** 只有一个子路由时默认降级成单个菜单项，写 true 才保留父级展开结构（permission.ts 的 alwaysShow 一致）。 */
    alwaysShow?: boolean
    /** 同级排序键，缺省按 99；动态路由的菜单顺序和 redirect 指向的首个子路由都靠它。 */
    order?: number
    /** 不进标签页，页面本身照常访问。 */
    hiddenTag?: boolean
    /** 固定页签：「关闭当前」这类标签命令对它置灰（TabBar/model/tabCommands.ts）。 */
    fixedTag?: boolean
    /** 侧边栏高亮路径：让详情页高亮它列表页（useSidebarMenu.ts 用 activePath 作激活判断）。 */
    activePath?: string
  }
}

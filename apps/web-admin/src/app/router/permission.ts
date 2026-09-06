/**
 * @file 权限路由构建器（精简版）
 * @description 后端菜单树 → Vue Router 动态路由，单文件闭环，面试可现场讲解
 */
import type { RouteMeta, Router, RouteRecordRaw } from 'vue-router'
import { notFoundRoute } from './routes/error'

// 后端菜单类型（精简自 UserMenuNode，仅保留必需字段）
export interface BackendMenu {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string | null
  icon: string | null
  permission: string | null
  component: string | null
  type: 'catalog' | 'menu'
  sort: number
  status: number
  children?: BackendMenu[]
}

// 扩展 RouteMeta，包含 order 用于排序
interface RouteMetaWithOrder extends RouteMeta {
  order?: number
  alwaysShow?: boolean
  auths?: string[]
}

// 布局组件
const Layout = () => import('@/layouts/index.vue')
// 404 兜底
const NotFound = () => import('@/pages/error/404.vue')
// 页面组件索引（Vite glob）
const pageModules = import.meta.glob('/src/pages/**/index.vue')

/** 规范化路径：去除多余斜杠，保留开头的 / */
const norm = (p: string) => p.replace(/\/+/g, '/').replace(/\/+$/, '')

/** 拼接父子路径：父路径已带 /，子路径不带 / */
const join = (parent: string, child: string) => `${parent.replace(/\/+$/, '')}/${child.replace(/^\/+/, '')}`

/** 解析组件：component 字段优先，回退到 fullPath，仅支持标准 /src/pages/{key}/index.vue */
function resolveComponent(menu: BackendMenu, fullPath: string): RouteRecordRaw['component'] {
  // 显式 null = 后端明确表示无对应组件，直接返回 404
  if (menu.component === null)
    return NotFound

  const key = (menu.component?.trim() || fullPath)
  const mod = pageModules[`/src/pages/${key}/index.vue`]
  if (mod)
    return mod

  if (import.meta.env.DEV) {
    console.warn('[router] 组件解析失败', {
      menuComponent: menu.component,
      fullPath,
      key,
    })
  }
  return NotFound
}

/** 递归构建路由节点 */
function buildRoute(menu: BackendMenu, parentPath = ''): RouteRecordRaw | null {
  // 过滤禁用菜单
  if (menu.status !== 1)
    return null

  // 计算完整路径：绝对路径直接用，相对路径拼接父路径
  const fullPath = menu.path.startsWith('/') ? norm(menu.path) : join(parentPath, menu.path)
  // 给 Vue Router 用的 path：根级保留 /，子级去掉父路径前缀
  const routePath = parentPath ? fullPath.replace(`${norm(parentPath)}/`, '') : fullPath

  const baseMeta: RouteMetaWithOrder = {
    title: menu.title,
    icon: menu.icon ?? undefined,
    auths: menu.permission ? [menu.permission] : undefined,
    order: menu.sort,
  }

  // 先构建子路由
  const children = menu.children?.map(c => buildRoute(c, fullPath)).filter(Boolean) as RouteRecordRaw[] ?? []

  // 对子路由按 order 排序，确保 redirect 指向正确的首个子路由
  children.sort((a, b) => ((a.meta as RouteMetaWithOrder)?.order ?? 99) - ((b.meta as RouteMetaWithOrder)?.order ?? 99))

  // 1) 目录类型：有子节点（过滤后仍有子节点）
  if (children.length > 0) {
    const first = children[0]
    const redirect = first.redirect ?? (first.path.startsWith('/') ? first.path : join(fullPath, first.path))

    const alwaysShow = children.length > 1 || children.some(c => c.children?.length)

    // 根级目录挂载 Layout，子级仅作分组
    if (!parentPath) {
      return {
        path: routePath,
        component: Layout,
        redirect,
        meta: {
          ...baseMeta,
          alwaysShow,
        },
        children,
      }
    }
    return {
      path: routePath,
      redirect,
      meta: {
        ...baseMeta,
        alwaysShow,
      },
      children,
    }
  }

  // 2) 目录但无子节点（如空 children=[]）：视为无效，返回 null
  if (menu.type === 'catalog') {
    return null
  }

  // 3) 叶子菜单：绑定真实组件 - 显式断言为 RouteRecordRaw 避免被推断为 RouteRecordRedirect
  return {
    path: routePath,
    name: menu.name ?? undefined,
    component: resolveComponent(menu, fullPath),
    meta: baseMeta,
  } as RouteRecordRaw
}

/** 入口：菜单树 → 路由数组（已排序） */
export function buildRoutes(menus: BackendMenu[]): RouteRecordRaw[] {
  return menus
    .map(m => buildRoute(m))
    .filter((r): r is RouteRecordRaw => r !== null)
    .sort((a, b) => ((a.meta as RouteMetaWithOrder)?.order ?? 99) - ((b.meta as RouteMetaWithOrder)?.order ?? 99))
}

/** 注册动态路由（含清理旧路由） */
let removeHandlers: (() => void)[] = []

export function registerDynamicRoutes(router: Router, menus: BackendMenu[]) {
  // 先移除旧路由
  resetDynamicRoutes()

  // 注册新路由
  for (const route of buildRoutes(menus)) {
    removeHandlers.push(router.addRoute(route))
  }
  // 兜底 404
  removeHandlers.push(router.addRoute(notFoundRoute))
}

/** 重置（登出调用） */
export function resetDynamicRoutes() {
  removeHandlers.forEach(fn => fn())
  removeHandlers = []
}

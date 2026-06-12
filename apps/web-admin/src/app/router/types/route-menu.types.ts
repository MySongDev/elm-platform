/**
 * @file 前端内部路由菜单模型
 * @domain router
 * @description 定义路由构建器消费的稳定内部模型，用来隔离后端菜单协议和 Vue Router 记录结构。
 */

export interface RouteMenuNode {
  path: string
  name?: string
  component?: string
  title?: string
  icon?: string
  order?: number
  auths?: string[]
  cacheName?: string
  hidden?: boolean
  children?: RouteMenuNode[]
}

export interface TabItem {
  key: string
  path: string
  fullPath: string
  title: string
  icon?: string
  fixed: boolean
  cacheName?: string
  /** @deprecated */
  name?: string
}

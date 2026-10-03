import type { Recordable } from 'vite-plugin-mock'

/**
 * vite-plugin-mock 的 response 回调参数。
 *
 * 插件把 response 声明为 `((opt) => any) | any`，联合 any 会让推断退化为 any，
 * strict 下解构参数即报 TS7031。此处显式标注，使 mock 路由能被类型检查覆盖。
 */
export interface MockResponseOptions {
  url: Recordable
  body: Recordable
  query: Recordable
  headers: Recordable
  params: Recordable
}

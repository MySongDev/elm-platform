/**
 * @file 全局请求实例
 * @domain shared/api
 * @description 暴露应用共享的 HTTP 客户端实例，并允许应用 provider 在启动时注入认证和错误处理回调。
 */

import type { HttpClientOptions, TypedHttpClient } from './http'
import { createHttpClient } from './http'

const httpOptions: HttpClientOptions = {}

/**
 * @description 有副作用：更新共享 HTTP 客户端配置对象，已创建的 request 会在后续请求中读取这些回调。
 * @param options 应用启动阶段注入的认证和错误处理回调。
 */
export function configureHttpClient(options: HttpClientOptions) {
  Object.assign(httpOptions, options)
}

const request: TypedHttpClient = createHttpClient(httpOptions)

export default request

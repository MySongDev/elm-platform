/**
 * @file OpenAPI 契约类型工具
 * @domain shared/api
 * @description
 * 把 `@elm-platform/api-types`(由后端 Swagger 自动生成)那串深层索引语法
 * `paths[P][M]['responses'][200]['content']['application/json']` 收敛成几个命名工具类型,
 * 让接入某个端点从"写四行推导 + 一个 ApiEnvelopeData helper"变成"一行"。
 *
 * 后端响应统一包了一层信封 `{ code, data, message }`,所以额外提供 `ApiResponseData`
 * 直接取出业务 `data`。
 */

import type { paths } from '@elm-platform/api-types'

/** 支持的 HTTP 方法字面量 */
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** 剥掉后端统一响应信封 `{ code, data, message }`,取出其中的 `data`;没有信封则原样返回 */
type UnwrapEnvelope<T> = T extends { data: infer Data } ? Data : T

/** 某端点某方法的 200 响应体(未剥信封的原始 application/json) */
export type ApiResponseBody<P extends keyof paths, M extends HttpMethod>
  = paths[P][M] extends { responses: { 200: { content: { 'application/json': infer R } } } } ? R : never

/** 某端点某方法的 200 响应体,剥掉信封后的业务数据 */
export type ApiResponseData<P extends keyof paths, M extends HttpMethod> = UnwrapEnvelope<ApiResponseBody<P, M>>

/** 某端点某方法的请求体(application/json) */
export type ApiRequestBody<P extends keyof paths, M extends HttpMethod>
  = paths[P][M] extends { requestBody: { content: { 'application/json': infer B } } } ? B : never

export type { paths }

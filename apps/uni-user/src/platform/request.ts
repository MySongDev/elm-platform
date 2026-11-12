/**
 * 平台适配收口层 —— 网络传输
 *
 * Batch 0 的最小可用实现，用于验证 uni.request 能否承载现有 policies 语义
 * （迁移方案 Batch 0 第 4、5 项）。Batch 1 第 3 项会在此基础上接入完整 policies。
 *
 * 设计要点（对照 web-user 的 services/http/request.js，axios 专属能力的替代）：
 * - AbortController/signal → RequestTask.abort()，保持调用方语义不变
 * - axios.CanceledError → 本文件的 CanceledError 类
 * - 错误结构统一为 TransportError（带 status/data/isNetworkError），
 *   ⚠️ 这是为了修掉 api-payment.js:36 的 axios.isAxiosError 静默失效陷阱（议题 6 / A7）
 * - withCredentials 直接不要：token 全走 storage，全库无 cookie 依赖
 */

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/config'

/**
 * 支持的 HTTP 方法。
 *
 * ⚠️ **刻意不含 `PATCH`** —— 这是 type-check 抓出的真实平台能力缺口：
 * `uni.request` 的类型签名只接受
 * `GET|POST|PUT|DELETE|OPTIONS|HEAD|TRACE|CONNECT`，**没有 PATCH**
 * （微信小程序 wx.request 本身就不支持）。
 *
 * web-user 的 `services/http/http.js:83` 导出了 `patch()`，但实测：
 * - 全库**零调用方**（只有定义）
 * - 后端 10 个 `@Patch` 端点全属 admin/auth/user/tenant/notification/elm-admin
 *   （管理端），**用户端 customer-\* 模块零 PATCH**
 * → 对本次迁移范围无影响。保留一个平台不支持的方法只会让它静默失败，故直接不提供。
 * 将来若用户端真需要 PATCH，要走「POST + 后端约定」或换 PUT 全量更新。
 */
export type TransportMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** 后端统一响应信封 */
export interface ApiEnvelope<T = unknown> {
  code: number
  data: T
  message: string
}

/** 传输层返回的原始响应（不做业务解包，交给上层 policies） */
export interface TransportResponse<T = unknown> {
  status: number
  data: T
  header: Record<string, string>
}

export interface TransportConfig {
  url: string
  method?: TransportMethod
  /** 请求体（非 GET）。⚠️ uni.request 的 data 对 GET 会拼进 query，但本层统一用 params 表达 query */
  data?: unknown
  /** query 参数。⚠️ uni.request 不会自动序列化对象参数，本层用 serializeQuery 处理 */
  params?: unknown
  header?: Record<string, string>
  timeout?: number
  /** 保留 AbortController 语义，内部映射到 RequestTask.abort() */
  signal?: AbortSignal
  /** 临时文件路径不能当 JSON 发；提供此项时由 uni.uploadFile 发送 multipart。 */
  upload?: {
    filePath: string
    name: string
  }
}

/** 请求被主动取消。替代 axios.CanceledError，policies 的取消判定改判这个类。 */
export class CanceledError extends Error {
  readonly isCanceled = true

  constructor(message = 'Request canceled') {
    super(message)
    this.name = 'CanceledError'
  }
}

/**
 * 统一错误结构。
 * ⚠️ uni.request 的失败回调只给 { errMsg }，不区分「网络不通」与「HTTP 4xx/5xx」：
 * 后者走 success 回调（statusCode 在 res 里）。这里把两者都归一成 TransportError，
 * 让上层能稳定判定，不必依赖任何库的私有类型。
 *
 * ⚠️ 这三个布尔字段是 policies 的判定依据（替代 axios 的 code 字符串）：
 * - isNetworkError: 对应 axios 的 ERR_NETWORK（网络不通/DNS 失败/域名校验拦截）
 * - isTimeout: 对应 axios 的 ECONNABORTED（超时）
 * - status: HTTP 状态码（4xx/5xx 走 success 回调，必须自己判）
 * 若缺这些字段，policies 的重试/提示会**静默失效**（永远 undefined），
 * 这正是 api-payment.js:36 的 axios.isAxiosError 陷阱的同构问题。
 */
export class TransportError extends Error {
  readonly status: number
  readonly data: unknown
  readonly isNetworkError: boolean
  readonly isTimeout: boolean

  constructor(options: {
    message: string
    status?: number
    data?: unknown
    isNetworkError?: boolean
    isTimeout?: boolean
  }) {
    super(options.message)
    this.name = 'TransportError'
    this.status = options.status ?? 0
    this.data = options.data
    this.isNetworkError = options.isNetworkError ?? false
    this.isTimeout = options.isTimeout ?? false
  }
}

/**
 * 把 params 序列化成 query string。
 *
 * ⚠️ uni.request **不会**自动拼 query（axios 会）—— web-user 的 GET 参数全靠
 * axios 序列化。这里必须自己实现，否则所有 GET 带参请求（如 /v1/cities?type=guess、
 * /shopping/restaurants?latitude=..）都会丢参数，且**不报错**，只表现为数据不对。
 *
 * 序列化规则对齐 axios 的默认 paramsSerializer：
 * - null/undefined 跳过
 * - 数组展开成重复 key（a=1&a=2）
 * - 对象/嵌套 JSON.stringify（axios 默认行为）
 * - 值 encodeURIComponent
 */
export function serializeQuery(params: unknown): string {
  if (!params || typeof params !== 'object') {
    return ''
  }

  const parts: string[] = []

  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined) {
          continue
        }
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`)
      }
      continue
    }

    if (typeof value === 'object') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`)
      continue
    }

    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }

  return parts.join('&')
}

/** 拼绝对 URL。已是绝对地址则原样返回。 */
function resolveUrl(url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url
  }
  const base = API_BASE_URL.replace(/\/+$/, '')
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export interface TransportHandle<T = unknown> {
  promise: Promise<TransportResponse<T>>
  abort: () => void
}

/**
 * 发起请求，返回 promise + abort 句柄。
 * 用句柄形式而非直接返回 promise，是为了让调用方能持有 abort（对齐 axios 的 signal 用法）。
 */
export function send<T = unknown>(config: TransportConfig): TransportHandle<T> {
  let task: UniApp.RequestTask | UniApp.UploadTask | null = null
  let aborted = false

  // ⚠️ params 显式序列化拼进 URL，**不**依赖 wx.request 对 GET data 的隐式序列化：
  // 后者对嵌套对象会产出 `[object Object]`，且数组/对象的规则与 axios 不一致，
  // 会造成「参数悄悄丢了」这类不报错的 bug。
  const query = serializeQuery(config.params)
  const baseUrl = resolveUrl(config.url)
  const finalUrl = query
    ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`
    : baseUrl

  const promise = new Promise<TransportResponse<T>>((resolve, reject) => {
    const acceptResponse = (status: number, data: unknown, header: Record<string, string> = {}) => {
      if (aborted) {
        reject(new CanceledError())
        return
      }
      // request 和 uploadFile 都可能把 HTTP 失败交给 success；不检查就会漏掉 401 刷新。
      if (status < 200 || status >= 300) {
        const message = (data as { message?: unknown } | null)?.message
        reject(new TransportError({
          message: typeof message === 'string' ? message : `Request failed with status ${status}`,
          status,
          data,
        }))
        return
      }
      resolve({
        status,
        data: data as T,
        header,
      })
    }

    const fail = (err: { errMsg?: string }) => {
      if (aborted) {
        reject(new CanceledError())
        return
      }
      const message = err?.errMsg || 'Network error'
      const isTimeout = /timeout|time out/i.test(message)
      reject(new TransportError({
        message,
        isNetworkError: !isTimeout,
        isTimeout,
      }))
    }

    if (config.upload) {
      task = uni.uploadFile({
        url: finalUrl,
        filePath: config.upload.filePath,
        name: config.upload.name,
        header: config.header,
        timeout: config.timeout ?? REQUEST_TIMEOUT,
        success: (res) => {
          if (aborted) {
            reject(new CanceledError())
            return
          }
          // uploadFile 返回字符串；解析异常必须 reject，否则异步回调抛错后等待者一直不结束。
          try {
            acceptResponse(res.statusCode, JSON.parse(res.data))
          }
          catch {
            reject(new TransportError({
              message: '上传响应格式异常，请重试',
              status: res.statusCode,
              data: res.data,
            }))
          }
        },
        fail,
      }) as unknown as UniApp.UploadTask
    }
    else {
      task = uni.request({
        url: finalUrl,
        method: config.method || 'GET',
        data: config.data as any,
        header: config.header,
        timeout: config.timeout ?? REQUEST_TIMEOUT,
        dataType: 'json',
        success: res => acceptResponse(res.statusCode, res.data, (res.header || {}) as Record<string, string>),
        fail,
      }) as unknown as UniApp.RequestTask
    }

    // AbortController → RequestTask.abort()，保持与 axios signal 相同的取消语义
    if (config.signal) {
      if (config.signal.aborted) {
        aborted = true
        task?.abort()
        reject(new CanceledError())
        return
      }
      config.signal.addEventListener('abort', () => {
        aborted = true
        task?.abort()
      })
    }
  })

  return {
    promise,
    abort: () => {
      aborted = true
      task?.abort()
    },
  }
}

/** 便捷方法：直接返回 promise（不需要 abort 时用） */
export async function request<T = unknown>(config: TransportConfig): Promise<TransportResponse<T>> {
  return send<T>(config).promise
}

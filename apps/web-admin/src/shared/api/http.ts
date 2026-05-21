/**
 * @file HTTP 客户端工厂
 * @domain shared/api
 * @description 统一封装 Axios 实例、业务响应解包和认证错误回调，避免业务模块直接依赖拦截器细节。
 */

import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

export interface HttpClientOptions {
  getToken?: () => string
  onUnauthorized?: () => void
  onForbidden?: () => void
  onError?: (message: string) => void
}

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export interface TypedHttpClient {
  get: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>
  delete: <T>(url: string, config?: AxiosRequestConfig) => Promise<T>
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message || error.message || fallback
  }

  return fallback
}

/**
 * @description 有副作用：创建 Axios 实例并注册请求/响应拦截器，后续请求会触发 token 注入和错误回调。
 * @param options HTTP 运行时回调，用于读取 token、处理未授权和统一错误提示。
 * @returns 面向业务模块的类型化 HTTP 客户端。
 */
export function createHttpClient(options: HttpClientOptions): TypedHttpClient {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
  })

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = options.getToken?.()

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    error => Promise.reject(error),
  )

  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<unknown>>) => {
      const body = response.data

      if (body.code !== 200) {
        if (body.code === 401) {
          options.onUnauthorized?.()
        }

        options.onError?.(body.message || '请求失败')
        return Promise.reject(new Error(body.message || 'Error'))
      }

      return body.data as unknown as AxiosResponse
    },
    (error) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined

      if (status === 401) {
        options.onUnauthorized?.()
      }
      else if (status === 403) {
        options.onForbidden?.()
      }
      else {
        options.onError?.(getErrorMessage(error, '网络异常'))
      }

      return Promise.reject(error)
    },
  )

  return client as unknown as TypedHttpClient
}

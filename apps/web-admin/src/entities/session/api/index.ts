/**
 * @file 用户资料与菜单 API
 * @domain entities/session
 * @description 封装当前登录用户资料、菜单和安全日志相关的后端请求边界。
 * 根据运行模式选择真实 HTTP adapter 或开发 mock adapter，对调用方保持统一契约。
 */

import type {
  SecurityLogQuery,
  UpdateProfileParams,
} from '../model/types'
import type {
  LoginCredentials,
  SessionApi,
} from './contracts'
import { realSessionApi } from './real-session-api'

export type { LoginCredentials, LoginResult, SessionApi } from './contracts'

let sessionApiPromise: Promise<SessionApi> | undefined

function isMockAuthEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ADMIN_MOCK_AUTH === 'true'
}

function resolveSessionApi() {
  sessionApiPromise ??= isMockAuthEnabled()
    ? import('./mock/mock-session-api').then(module => module.mockSessionApi)
    : Promise.resolve(realSessionApi)
  return sessionApiPromise
}

/**
 * @description 使用账号密码登录后端。
 * @param credentials 登录凭据。
 * @returns 包含 token、有效期和用户信息的结果。
 */
export async function login(credentials: LoginCredentials) {
  return (await resolveSessionApi()).login(credentials)
}

/**
 * @description 获取当前登录用户资料。
 * @returns 当前用户信息。
 */
export async function getCurrentUser() {
  return (await resolveSessionApi()).getCurrentUser()
}

/**
 * @description 获取当前登录用户可访问的菜单树；调用方会基于该数据生成动态路由。
 * @returns 后端菜单树。
 */
export async function getUserMenus() {
  return (await resolveSessionApi()).getUserMenus()
}

/**
 * @description 更新当前登录用户资料，并返回后端确认后的用户信息。
 * @param data 用户资料更新参数。
 * @returns 更新后的用户信息。
 */
export async function updateProfile(data: UpdateProfileParams) {
  return (await resolveSessionApi()).updateProfile(data)
}

/**
 * @description 获取当前用户安全日志分页数据。
 * @param params 安全日志分页查询参数。
 * @returns 安全日志分页结果。
 */
export async function getSecurityLogs(params: SecurityLogQuery) {
  return (await resolveSessionApi()).getSecurityLogs(params)
}

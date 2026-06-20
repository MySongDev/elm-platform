/**
 * @file 用户资料与菜单 API
 * @domain entities/session
 * @description 封装当前登录用户资料、菜单和安全日志相关的后端请求边界。
 * 当前实现直接委托给真实 HTTP adapter；后续会按运行模式切换 mock adapter。
 */

import { realSessionApi } from './real-session-api'

export type { LoginCredentials, LoginResult, SessionApi } from './contracts'

/**
 * @description 使用账号密码登录后端。
 * @param credentials 登录凭据。
 * @returns 包含 token、有效期和用户信息的结果。
 */
export const login = realSessionApi.login

/**
 * @description 获取当前登录用户资料。
 * @returns 当前用户信息。
 */
export const getCurrentUser = realSessionApi.getCurrentUser

/**
 * @description 获取当前登录用户可访问的菜单树；调用方会基于该数据生成动态路由。
 * @returns 后端菜单树。
 */
export const getUserMenus = realSessionApi.getUserMenus

/**
 * @description 更新当前登录用户资料，并返回后端确认后的用户信息。
 * @param data 用户资料更新参数。
 * @returns 更新后的用户信息。
 */
export const updateProfile = realSessionApi.updateProfile

/**
 * @description 获取当前用户安全日志分页数据。
 * @param params 安全日志分页查询参数。
 * @returns 安全日志分页结果。
 */
export const getSecurityLogs = realSessionApi.getSecurityLogs

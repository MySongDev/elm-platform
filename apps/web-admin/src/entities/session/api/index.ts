/**
 * @file 用户资料与菜单 API
 * @domain entities/session
 * @description 封装当前登录用户资料、菜单和安全日志相关的后端请求边界。
 * 对调用方保持统一契约，所有请求均通过真实 HTTP adapter 发出。
 */

import { realSessionApi } from './real-session-api'

export type { LoginCredentials, LoginResult, SessionApi } from './contracts'

export const login = realSessionApi.login
export const getCurrentUser = realSessionApi.getCurrentUser
export const getUserMenus = realSessionApi.getUserMenus
export const updateProfile = realSessionApi.updateProfile
export const getSecurityLogs = realSessionApi.getSecurityLogs

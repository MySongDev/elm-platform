/**
 * @file 用户资料与菜单 API
 * @domain entities/session
 * @description 封装当前登录用户资料、菜单和安全日志相关的后端请求边界。
 */

import type { SecurityLogQuery, SecurityLogResult, UpdateProfileParams, UserMenuNode } from '../model'
import type { UserInfo } from '@/entities/user'
import { authEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 有远端副作用：更新当前登录用户资料，并返回后端确认后的用户信息。
 * @param data 用户资料更新参数。
 * @returns 更新后的用户信息。
 */
export function updateProfile(data: UpdateProfileParams) {
  return request.patch<UserInfo>(authEndpoints.profile, data)
}

/**
 * @description 获取当前登录用户可访问的菜单树；调用方会基于该数据生成动态路由。
 * @returns 后端菜单树。
 */
export function getUserMenus() {
  return request.get<UserMenuNode[]>(authEndpoints.menus)
}

/**
 * @description 获取当前用户安全日志分页数据。
 * @param params 安全日志分页查询参数。
 * @returns 安全日志分页结果。
 */
export function getSecurityLogs(params: SecurityLogQuery) {
  return request.get<SecurityLogResult>(authEndpoints.securityLogs, { params })
}

/**
 * @file 角色 API
 * @domain entities/role
 * @description 封装系统角色列表、创建、更新和删除的后端请求边界。
 */

import type { RoleItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取系统角色列表。
 * @returns 角色列表。
 */
export function getRoles() {
  return request.get<RoleItem[]>(adminEndpoints.system.roles)
}

/**
 * @description 有远端副作用：创建系统角色。
 * @param data 角色参数。
 * @returns 创建后的角色信息。
 */
export function createRole(data: Partial<RoleItem>) {
  return request.post<RoleItem>(adminEndpoints.system.roles, data)
}

/**
 * @description 有远端副作用：更新系统角色。
 * @param id 角色 ID。
 * @param data 角色参数。
 * @returns 更新后的角色信息。
 */
export function updateRole(id: number, data: Partial<RoleItem>) {
  return request.patch<RoleItem>(adminEndpoints.system.roleDetail(id), data)
}

/**
 * @description 有远端副作用：删除系统角色。
 * @param id 角色 ID。
 */
export function deleteRole(id: number) {
  return request.delete<void>(adminEndpoints.system.roleDetail(id))
}

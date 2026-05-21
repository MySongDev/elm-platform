/**
 * @file 系统菜单 API
 * @domain entities/system-menu
 * @description 封装系统菜单配置的列表、创建、更新和删除后端请求边界。
 */

import type { MenuItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取系统菜单配置列表。
 * @returns 菜单配置列表。
 */
export function getMenus() {
  return request.get<MenuItem[]>(adminEndpoints.system.menus)
}

/**
 * @description 有远端副作用：创建系统菜单配置。
 * @param data 菜单配置参数。
 * @returns 创建后的菜单配置。
 */
export function createMenu(data: Partial<MenuItem>) {
  return request.post<MenuItem>(adminEndpoints.system.menus, data)
}

/**
 * @description 有远端副作用：更新系统菜单配置。
 * @param id 菜单 ID。
 * @param data 菜单配置参数。
 * @returns 更新后的菜单配置。
 */
export function updateMenu(id: number, data: Partial<MenuItem>) {
  return request.patch<MenuItem>(adminEndpoints.system.menuDetail(id), data)
}

/**
 * @description 有远端副作用：删除系统菜单配置。
 * @param id 菜单 ID。
 */
export function deleteMenu(id: number) {
  return request.delete<void>(adminEndpoints.system.menuDetail(id))
}

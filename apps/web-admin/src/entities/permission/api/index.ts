/**
 * @file 权限 API
 * @domain entities/permission
 * @description 封装页面权限和按钮权限的后端读取边界。
 */

import type { ButtonPermission, PagePermission } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取页面级权限配置。
 * @returns 页面权限列表。
 */
export function getPagePermissions() {
  return request.get<PagePermission[]>(adminEndpoints.permissions.pages)
}

/**
 * @description 获取按钮级权限配置。
 * @returns 按钮权限列表。
 */
export function getButtonPermissions() {
  return request.get<ButtonPermission[]>(adminEndpoints.permissions.buttons)
}

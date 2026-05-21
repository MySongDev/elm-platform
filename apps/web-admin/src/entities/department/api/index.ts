/**
 * @file 部门 API
 * @domain entities/department
 * @description 封装系统部门列表、创建、更新和删除的后端请求边界。
 */

import type { DeptItem } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取部门列表。
 * @returns 部门列表。
 */
export function getDepts() {
  return request.get<DeptItem[]>(adminEndpoints.system.depts)
}

/**
 * @description 有远端副作用：创建部门。
 * @param data 部门参数。
 * @returns 创建后的部门信息。
 */
export function createDept(data: Partial<DeptItem>) {
  return request.post<DeptItem>(adminEndpoints.system.depts, data)
}

/**
 * @description 有远端副作用：更新部门。
 * @param id 部门 ID。
 * @param data 部门参数。
 * @returns 更新后的部门信息。
 */
export function updateDept(id: number, data: Partial<DeptItem>) {
  return request.patch<DeptItem>(adminEndpoints.system.deptDetail(id), data)
}

/**
 * @description 有远端副作用：删除部门。
 * @param id 部门 ID。
 */
export function deleteDept(id: number) {
  return request.delete<void>(adminEndpoints.system.deptDetail(id))
}

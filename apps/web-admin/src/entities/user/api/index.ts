/**
 * @file 用户 API
 * @domain entities/user
 * @description 封装用户管理列表、详情、创建、更新和删除的后端请求边界。
 */

import type { CreateUserParams, UpdateUserParams, UserInfo } from '../model'
import { userEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取用户列表。
 * @returns 用户列表。
 */
export function getUserList() {
  return request.get<UserInfo[]>(userEndpoints.list)
}

/**
 * @description 获取单个用户详情。
 * @param id 用户 ID。
 * @returns 用户详情。
 */
export function getUserDetail(id: number) {
  return request.get<UserInfo>(userEndpoints.detail(id))
}

/**
 * @description 有远端副作用：创建用户记录。
 * @param data 新用户参数。
 * @returns 后端创建后的用户信息。
 */
export function createUser(data: CreateUserParams) {
  return request.post<UserInfo>(userEndpoints.create, data)
}

/**
 * @description 有远端副作用：更新用户记录。
 * @param id 用户 ID。
 * @param data 用户更新参数。
 * @returns 更新后的用户信息。
 */
export function updateUser(id: number, data: UpdateUserParams) {
  return request.patch<UserInfo>(userEndpoints.update(id), data)
}

/**
 * @description 有远端副作用：删除用户记录。
 * @param id 用户 ID。
 */
export function deleteUser(id: number) {
  return request.delete<void>(userEndpoints.delete(id))
}

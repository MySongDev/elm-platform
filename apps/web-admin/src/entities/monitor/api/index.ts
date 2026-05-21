/**
 * @file 在线用户 API
 * @domain entities/monitor
 * @description 封装在线用户监控和强制下线的后端请求边界。
 */

import type { OnlineUser } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取当前在线用户列表。
 * @returns 在线用户列表。
 */
export function getOnlineUsers() {
  return request.get<OnlineUser[]>(adminEndpoints.monitor.onlineUsers)
}

/**
 * @description 有远端副作用：强制指定在线用户退出登录。
 * @param id 在线用户 ID。
 */
export function forceLogoutOnlineUser(id: number) {
  return request.post<void>(adminEndpoints.monitor.forceLogout(id))
}

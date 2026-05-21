/**
 * @file 系统日志 API
 * @domain entities/log
 * @description 封装登录日志、操作日志和系统日志的后端读取边界。
 */

import type { LoginLog, OperationLog, SystemLog } from '../model'
import { adminEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

/**
 * @description 获取登录日志列表。
 * @returns 登录日志列表。
 */
export function getLoginLogs() {
  return request.get<LoginLog[]>(adminEndpoints.monitor.loginLogs)
}

/**
 * @description 获取操作日志列表。
 * @returns 操作日志列表。
 */
export function getOperationLogs() {
  return request.get<OperationLog[]>(adminEndpoints.monitor.operationLogs)
}

/**
 * @description 获取系统日志列表。
 * @returns 系统日志列表。
 */
export function getSystemLogs() {
  return request.get<SystemLog[]>(adminEndpoints.monitor.systemLogs)
}

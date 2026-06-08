import type { CreateTenantParams, TenantActionLog, TenantEvent, TenantInfo, TenantTransitionParams, UpdateTenantParams } from '../model'
import { tenantEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export function getTenantList() {
  return request.get<TenantInfo[]>(tenantEndpoints.list)
}

export function getTenantDetail(id: number) {
  return request.get<TenantInfo>(tenantEndpoints.detail(id))
}

export function createTenant(data: CreateTenantParams) {
  return request.post<TenantInfo>(tenantEndpoints.create, data)
}

export function updateTenant(id: number, data: UpdateTenantParams) {
  return request.patch<TenantInfo>(tenantEndpoints.update(id), data)
}

export function transitionTenant(id: number, event: TenantEvent, data?: TenantTransitionParams) {
  return request.post<TenantInfo>(tenantEndpoints.transition(id, event), data ?? {})
}

export function getTenantActionLogs(id: number) {
  return request.get<TenantActionLog[]>(tenantEndpoints.actionLogs(id))
}

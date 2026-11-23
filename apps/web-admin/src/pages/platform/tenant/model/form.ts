/**
 * @file 租户表单数据
 * @domain pages/platform/tenant
 * @description 创建独立租户草稿，并明确区分创建与更新请求字段。
 */

import type { CreateTenantParams, TenantInfo, UpdateTenantParams } from '@/entities/tenant'

export interface TenantFormState {
  code: string
  name: string
  contactName: string
  contactPhone: string
  contactEmail: string
  planCode: string
  remark: string
}

export function createTenantForm(tenant: TenantInfo | null = null): TenantFormState {
  return {
    code: tenant?.code ?? '',
    name: tenant?.name ?? '',
    contactName: tenant?.contactName || '',
    contactPhone: tenant?.contactPhone || '',
    contactEmail: tenant?.contactEmail || '',
    planCode: tenant?.planCode ?? 'standard',
    remark: tenant?.remark || '',
  }
}

// 可选字段保持原有空字符串 → undefined 契约，不额外裁剪输入或改成 null。
export function toCreateTenantParams(form: TenantFormState): CreateTenantParams {
  return {
    code: form.code,
    name: form.name,
    contactName: form.contactName || undefined,
    contactPhone: form.contactPhone || undefined,
    contactEmail: form.contactEmail || undefined,
    planCode: form.planCode || undefined,
    remark: form.remark || undefined,
  }
}

// 编码创建后不可修改，更新字段在这里列明，避免把草稿的 code 一起发给后端。
export function toUpdateTenantParams(form: TenantFormState): UpdateTenantParams {
  return {
    name: form.name,
    contactName: form.contactName || undefined,
    contactPhone: form.contactPhone || undefined,
    contactEmail: form.contactEmail || undefined,
    planCode: form.planCode || undefined,
    remark: form.remark || undefined,
  }
}

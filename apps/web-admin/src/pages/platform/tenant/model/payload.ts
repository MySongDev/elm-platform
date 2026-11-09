import type { CreateTenantParams, UpdateTenantParams } from '@/entities/tenant'

export interface TenantFormState {
  code: string
  name: string
  contactName: string
  contactPhone: string
  contactEmail: string
  planCode: string
  remark: string
  _tenantId?: number
}

export function toTenantPayload(form: TenantFormState): CreateTenantParams | UpdateTenantParams {
  const { _tenantId, code, ...rest } = form

  const payload = {
    ...rest,
    contactName: rest.contactName || undefined,
    contactPhone: rest.contactPhone || undefined,
    contactEmail: rest.contactEmail || undefined,
    planCode: rest.planCode || undefined,
    remark: rest.remark || undefined,
  }

  if (_tenantId) {
    return payload
  }

  return {
    ...payload,
    code,
  }
}

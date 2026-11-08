export interface TenantCreateInput {
  name: string
  code: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  planCode?: string
  remark?: string
}

export interface TenantUpdateInput {
  name: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  planCode?: string
  remark?: string
}

export interface TenantTransitionInput {
  reason?: string
  remark?: string
}

export const merchantApplicationStatuses = [
  'PENDING',
  'UNDER_REVIEW',
  'SUPPLEMENT_REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELED',
] as const
export type MerchantApplicationStatus = (typeof merchantApplicationStatuses)[number]

export const merchantApplicationReviewActions = [
  'START_REVIEW',
  'APPROVE',
  'REJECT',
  'REQUEST_SUPPLEMENT',
] as const
export type MerchantApplicationReviewAction = (typeof merchantApplicationReviewActions)[number]

export const merchantApplicationActions = [
  'VIEW',
  ...merchantApplicationReviewActions,
] as const
export type MerchantApplicationAction = (typeof merchantApplicationActions)[number]

export const merchantApplicationActorTypes = [
  'PLATFORM_ADMIN',
  'TENANT_ADMIN',
  'SHOP_OPERATOR',
  'SYSTEM',
] as const
export type MerchantApplicationActorType = (typeof merchantApplicationActorTypes)[number]

export interface MerchantApplicationActor {
  id: number | 'system'
  name: string
  type: MerchantApplicationActorType
}

export interface MerchantApplicationQuery {
  status?: MerchantApplicationStatus | string
  merchantName?: string
  page?: number | string
  pageSize?: number | string
}

export interface MerchantApplicationReviewPayload {
  action: MerchantApplicationReviewAction
  reason?: string
  remark?: string
}

export interface ApplicationMaterial {
  id: string
  name: string
  type: 'image' | 'pdf' | 'file'
  url: string
}

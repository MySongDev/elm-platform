/**
 * 商家入驻申请 — Entity 类型定义
 */

/** 申请状态 */
export type MerchantApplicationStatus
  = | 'PENDING'
    | 'UNDER_REVIEW'
    | 'SUPPLEMENT_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELED'

/** 管理端可执行的动作 */
export type MerchantApplicationAction
  = | 'VIEW'
    | 'START_REVIEW'
    | 'APPROVE'
    | 'REJECT'
    | 'REQUEST_SUPPLEMENT'

/** 材料类型 */
export type MaterialType = 'image' | 'pdf' | 'file'

/** 提交材料 */
export interface ApplicationMaterial {
  id: string
  name: string
  type: MaterialType
  url: string
}

/** 申请记录 */
export interface MerchantApplication {
  id: string
  /** 商家名称 */
  merchantName: string
  /** 联系人 */
  contactName: string
  /** 联系电话 */
  contactPhone: string
  /** 经营品类 */
  businessCategory: string
  /** 经营地址 */
  address: string
  /** 申请状态 */
  status: MerchantApplicationStatus
  /** 后端返回的可用动作 */
  availableActions: MerchantApplicationAction[]
  /** 提交材料 */
  materials: ApplicationMaterial[]
  /** 申请时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/** 审核操作日志 */
export interface MerchantApplicationLog {
  id: string
  event: MerchantApplicationAction | string
  fromStatus: MerchantApplicationStatus
  toStatus: MerchantApplicationStatus
  actorName: string
  reason?: string
  remark?: string
  createdAt: string
}

/** 列表查询参数 */
export interface MerchantApplicationQuery {
  status?: MerchantApplicationStatus
  merchantName?: string
  page?: number
  pageSize?: number
}

/** 审核操作参数 */
export interface MerchantApplicationReviewParams {
  action: MerchantApplicationAction
  reason?: string
  remark?: string
}

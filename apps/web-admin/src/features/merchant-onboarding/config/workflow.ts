import type { MerchantApplicationAction, MerchantApplicationStatus } from '@/entities/merchant-onboarding'
import type { ActionConfig, StatusTagConfig } from '@/shared/workflow'
import { Permissions } from '@/shared/config/access'

export const merchantStatusMap: Record<MerchantApplicationStatus, StatusTagConfig> = {
  PENDING: {
    label: '待审核',
    type: 'warning',
  },
  UNDER_REVIEW: {
    label: '审核中',
    type: 'primary',
  },
  SUPPLEMENT_REQUESTED: {
    label: '待补充材料',
    type: 'info',
  },
  APPROVED: {
    label: '已通过',
    type: 'success',
  },
  REJECTED: {
    label: '已驳回',
    type: 'danger',
  },
  CANCELED: {
    label: '已取消',
    type: 'info',
  },
}

export const merchantActionMap: Record<MerchantApplicationAction, ActionConfig> = {
  VIEW: {
    label: '查看',
    type: 'primary',
  },
  START_REVIEW: {
    label: '开始审核',
    type: 'primary',
    permission: Permissions.MERCHANT_ONBOARDING_REVIEW,
    confirmText: '确定开始审核此申请？',
  },
  APPROVE: {
    label: '通过',
    type: 'success',
    permission: Permissions.MERCHANT_ONBOARDING_APPROVE,
  },
  REJECT: {
    label: '驳回',
    type: 'danger',
    permission: Permissions.MERCHANT_ONBOARDING_REJECT,
    danger: true,
  },
  REQUEST_SUPPLEMENT: {
    label: '要求补充材料',
    type: 'warning',
    permission: Permissions.MERCHANT_ONBOARDING_REVIEW,
  },
}

/** 时间线事件标签映射 */
export const merchantEventLabelMap: Record<string, string> = {
  VIEW: '查看',
  START_REVIEW: '开始审核',
  APPROVE: '审核通过',
  REJECT: '驳回',
  REQUEST_SUPPLEMENT: '要求补充材料',
  RESUBMIT: '重新提交',
  CANCEL: '取消申请',
}

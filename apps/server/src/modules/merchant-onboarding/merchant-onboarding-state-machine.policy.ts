import type {
  MerchantApplicationAction,
  MerchantApplicationActorType,
  MerchantApplicationReviewAction,
  MerchantApplicationStatus,
} from './merchant-onboarding.types'
import { ConflictException, ForbiddenException } from '@nestjs/common'

const merchantApplicationTransitions: Record<
  MerchantApplicationStatus,
  Partial<Record<MerchantApplicationReviewAction, MerchantApplicationStatus>>
> = {
  PENDING: {
    START_REVIEW: 'UNDER_REVIEW',
  },
  UNDER_REVIEW: {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    REQUEST_SUPPLEMENT: 'SUPPLEMENT_REQUESTED',
  },
  SUPPLEMENT_REQUESTED: {
    START_REVIEW: 'UNDER_REVIEW',
  },
  APPROVED: {},
  REJECTED: {},
  CANCELED: {},
}

const allowedActorMap: Record<MerchantApplicationReviewAction, MerchantApplicationActorType[]> = {
  START_REVIEW: ['PLATFORM_ADMIN'],
  APPROVE: ['PLATFORM_ADMIN'],
  REJECT: ['PLATFORM_ADMIN'],
  REQUEST_SUPPLEMENT: ['PLATFORM_ADMIN'],
}

export function getNextMerchantApplicationStatus(
  status: MerchantApplicationStatus,
  action: MerchantApplicationReviewAction,
): MerchantApplicationStatus {
  const next = merchantApplicationTransitions[status]?.[action]

  if (!next)
    throw new ConflictException('Current merchant application status does not allow this action')

  return next
}

export function getAvailableMerchantApplicationActions(status: MerchantApplicationStatus): MerchantApplicationAction[] {
  return [
    'VIEW',
    ...Object.keys(merchantApplicationTransitions[status] || {}) as MerchantApplicationReviewAction[],
  ]
}

export function assertMerchantApplicationActorCanTrigger(
  action: MerchantApplicationReviewAction,
  actorType: MerchantApplicationActorType,
) {
  if (!allowedActorMap[action]?.includes(actorType)) {
    throw new ForbiddenException('No permission to review merchant applications')
  }
}

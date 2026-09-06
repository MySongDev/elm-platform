import { ConflictException, ForbiddenException } from '@nestjs/common'
import {
  assertMerchantApplicationActorCanTrigger,
  getAvailableMerchantApplicationActions,
  getNextMerchantApplicationStatus,
} from './merchant-onboarding-state-machine.policy'

describe('merchantOnboardingStateMachinePolicy', () => {
  it('returns admin actions from the current application status', () => {
    expect(getAvailableMerchantApplicationActions('PENDING')).toEqual(['VIEW', 'START_REVIEW'])
    expect(getAvailableMerchantApplicationActions('UNDER_REVIEW')).toEqual([
      'VIEW',
      'APPROVE',
      'REJECT',
      'REQUEST_SUPPLEMENT',
    ])
    expect(getAvailableMerchantApplicationActions('SUPPLEMENT_REQUESTED')).toEqual(['VIEW', 'START_REVIEW'])
    expect(getAvailableMerchantApplicationActions('APPROVED')).toEqual(['VIEW'])
  })

  it('calculates the next status for valid review actions', () => {
    expect(getNextMerchantApplicationStatus('PENDING', 'START_REVIEW')).toBe('UNDER_REVIEW')
    expect(getNextMerchantApplicationStatus('UNDER_REVIEW', 'APPROVE')).toBe('APPROVED')
    expect(getNextMerchantApplicationStatus('UNDER_REVIEW', 'REJECT')).toBe('REJECTED')
    expect(getNextMerchantApplicationStatus('UNDER_REVIEW', 'REQUEST_SUPPLEMENT')).toBe('SUPPLEMENT_REQUESTED')
  })

  it('rejects invalid review transitions', () => {
    expect(() => getNextMerchantApplicationStatus('APPROVED', 'REJECT')).toThrow(ConflictException)
    expect(() => getNextMerchantApplicationStatus('PENDING', 'APPROVE')).toThrow(ConflictException)
  })

  it('only allows platform admins to trigger review actions', () => {
    expect(() => assertMerchantApplicationActorCanTrigger('APPROVE', 'PLATFORM_ADMIN')).not.toThrow()
    expect(() => assertMerchantApplicationActorCanTrigger('APPROVE', 'TENANT_ADMIN')).toThrow(ForbiddenException)
  })
})

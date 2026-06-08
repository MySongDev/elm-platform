import type {
  MerchantApplication,
  MerchantApplicationLog,
  MerchantApplicationQuery,
  MerchantApplicationReviewParams,
} from '../model/types'
import { merchantOnboardingEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export function getMerchantApplicationList(params?: MerchantApplicationQuery) {
  return request.get<MerchantApplication[]>(merchantOnboardingEndpoints.list, { params })
}

export function getMerchantApplicationDetail(id: string) {
  return request.get<MerchantApplication>(merchantOnboardingEndpoints.detail(id))
}

export function reviewMerchantApplication(id: string, data: MerchantApplicationReviewParams) {
  return request.post<MerchantApplication>(merchantOnboardingEndpoints.review(id), data)
}

export function getMerchantApplicationLogs(id: string) {
  return request.get<MerchantApplicationLog[]>(merchantOnboardingEndpoints.actionLogs(id))
}

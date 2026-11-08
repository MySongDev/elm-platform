import type { MerchantApplicationReviewAction } from '../../../../modules/merchant-onboarding/merchant-onboarding.types'
import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import {
  merchantApplicationReviewActions,
  merchantApplicationStatuses,
} from '../../../../modules/merchant-onboarding/merchant-onboarding.types'

export class MerchantApplicationQueryDto {
  @IsOptional()
  @IsIn(merchantApplicationStatuses)
  status?: string

  @IsOptional()
  @IsString()
  merchantName?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number
}

export class ReviewMerchantApplicationDto {
  @IsIn(merchantApplicationReviewActions)
  action!: MerchantApplicationReviewAction

  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsString()
  remark?: string
}

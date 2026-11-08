import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class RejectRefundDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  reason!: string
}

export class ApproveRefundDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string
}

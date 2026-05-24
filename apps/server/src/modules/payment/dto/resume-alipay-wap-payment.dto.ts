import { IsString } from 'class-validator'

export class ResumeAlipayWapPaymentDto {
  @IsString()
  orderNo!: string

  @IsString()
  userId!: string
}

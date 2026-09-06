import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class ResumeAlipayWapPaymentDto {
  @ApiProperty({
    description: 'Payment order number to resume.',
    example: 'ELMALI202605241200000001',
  })
  @IsString()
  orderNo!: string
}

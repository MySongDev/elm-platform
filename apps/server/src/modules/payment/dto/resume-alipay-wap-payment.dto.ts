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

export class ResumeAlipayWapPaymentResponseDto {
  @ApiProperty({
    description: 'Payment order number.',
    example: 'ELMALI202605241200000001',
  })
  orderNo!: string

  @ApiProperty({
    description: 'Redirect URL for continuing the Alipay WAP payment.',
    example: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
  })
  payUrl!: string

  @ApiProperty({
    description: 'Amount still payable by the customer.',
    example: 29,
  })
  payableAmount!: number
}

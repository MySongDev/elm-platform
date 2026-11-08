import { ApiProperty } from '@nestjs/swagger'

export class SuccessResponseDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean
}

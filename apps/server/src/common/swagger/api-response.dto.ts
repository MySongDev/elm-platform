import { ApiProperty } from '@nestjs/swagger'

export class ApiResponseEnvelopeDto {
  @ApiProperty({
    description: '业务成功码，固定为 200',
    example: 200,
  })
  code!: number

  @ApiProperty({
    description: '响应消息',
    example: 'success',
  })
  message!: string

  @ApiProperty({
    description: '响应时间，ISO 8601 格式',
    example: '2026-07-01T08:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string
}

export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'HTTP 错误状态码',
    example: 400,
  })
  code!: number

  @ApiProperty({
    description: '错误原因',
    example: '请求参数错误',
  })
  message!: string

  @ApiProperty({
    description: '错误发生时间，ISO 8601 格式',
    example: '2026-07-01T08:00:00.000Z',
    format: 'date-time',
  })
  timestamp!: string

  @ApiProperty({
    description: '请求路径',
    example: '/api/users/1',
  })
  path!: string
}

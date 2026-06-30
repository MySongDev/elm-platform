import { ApiProperty } from '@nestjs/swagger'

export class CustomerProfileResponseDto {
  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '用户ID（别名）',
    example: 1,
  })
  user_id: number

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
  })
  phone: string

  @ApiProperty({
    description: '手机号（别名）',
    example: '13800138000',
  })
  mobile: string

  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  username: string

  @ApiProperty({
    description: '昵称',
    example: '小明',
    nullable: true,
    type: String,
  })
  nickname: string | null

  @ApiProperty({
    description: '头像',
    example: 'https://example.com/avatar.jpg',
  })
  avatar: string

  @ApiProperty({
    description: '状态',
    example: 1,
  })
  status: number
}

export class CustomerTokenResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  token: string

  @ApiProperty({
    description: '访问令牌（别名）',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken: string

  @ApiProperty({
    description: '令牌有效期（秒）',
    example: 1800,
  })
  expiresIn: number

  @ApiProperty({
    description: '刷新令牌',
    example: 'uuid.randomsecret',
  })
  refreshToken: string

  @ApiProperty({
    description: '刷新令牌有效期（秒）',
    example: 2592000,
  })
  refreshExpiresIn: number

  @ApiProperty({
    description: '用户信息',
    type: CustomerProfileResponseDto,
  })
  user: CustomerProfileResponseDto
}

export class SmsSendResponseDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: '调试验证码（仅 mock 模式下返回）',
    example: '123456',
    nullable: true,
    type: String,
  })
  debugCode?: string
}

export class CustomerLogoutResponseDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean
}

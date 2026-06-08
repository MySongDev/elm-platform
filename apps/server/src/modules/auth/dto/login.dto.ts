import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: '用户名或手机号',
    example: 'admin',
  })
  @ValidateIf((dto: LoginDto) => !dto.username)
  @IsString()
  account?: string

  @ApiPropertyOptional({
    description: '兼容旧字段：用户名',
    example: 'admin',
  })
  @ValidateIf((dto: LoginDto) => !dto.account)
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({
    description: '密码',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  password: string

  @ApiPropertyOptional({
    description: '是否签发 7 天免登录 token',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean
}

export class LoginTenantDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'default' })
  code: string

  @ApiProperty({ example: 'Default Tenant' })
  name: string

  @ApiProperty({ example: 'ACTIVE' })
  status: string
}

export class LoginUserDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: 'admin' })
  username: string

  @ApiProperty({
    example: 'admin@example.com',
    nullable: true,
    type: String,
  })
  email: string | null

  @ApiProperty({
    example: '13800138000',
    nullable: true,
    type: String,
  })
  phone: string | null

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
  })
  avatar: string | null

  @ApiProperty({ example: 1 })
  status: number

  @ApiProperty({
    enum: ['admin', 'user'],
    example: 'admin',
  })
  role: 'admin' | 'user'

  @ApiProperty({
    type: [String],
    example: ['*:*:*'],
  })
  permissions: string[]

  @ApiProperty({
    type: LoginTenantDto,
    nullable: true,
  })
  tenant: LoginTenantDto | null

  @ApiProperty({ example: 'ALL' })
  dataScope: string

  @ApiProperty({
    type: [String],
    example: ['shop-1'],
  })
  boundShopIds: string[]
}

export class LoginResponseDto {
  @ApiProperty({ example: 'jwt-token' })
  token: string

  @ApiProperty({ example: 86400 })
  expiresIn: number

  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto
}

export class LoginHttpResponseDto {
  @ApiProperty({ example: 200 })
  code: number

  @ApiProperty({ example: 'success' })
  message: string

  @ApiProperty({ type: LoginResponseDto })
  data: LoginResponseDto

  @ApiProperty({ example: '2026-06-08T00:00:00.000Z' })
  timestamp: string
}

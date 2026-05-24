import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator'

export class LoginDto {
  @ApiProperty({ description: '用户名或手机号', example: 'admin' })
  @ValidateIf((dto: LoginDto) => !dto.username)
  @IsString()
  account?: string

  @ApiPropertyOptional({ description: '兼容旧字段：用户名', example: 'admin' })
  @ValidateIf((dto: LoginDto) => !dto.account)
  @IsOptional()
  @IsString()
  username?: string

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @MinLength(6)
  password: string

  @ApiPropertyOptional({ description: '是否签发 7 天免登录 token', example: true })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean
}

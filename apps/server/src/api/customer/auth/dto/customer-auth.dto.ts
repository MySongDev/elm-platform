import type { SmsScene } from '../../../../modules/sms/sms-provider'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator'

export class SendSmsDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138001',
  })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string

  @ApiProperty({
    description: '验证码场景',
    enum: ['login', 'reset_password'],
  })
  @IsIn(['login', 'reset_password'])
  scene: SmsScene
}

export class CustomerPasswordLoginDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138001',
  })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string
}

export class CustomerSmsLoginDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138001',
  })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string

  @ApiProperty({
    description: '短信验证码',
    example: '123456',
  })
  @IsString()
  smsCode: string
}

export class UpdateCustomerNicknameDto {
  @ApiProperty({
    description: '用户名（昵称），去除首尾空格后为 2～24 个字符',
    example: '外卖达人',
    minLength: 2,
    maxLength: 24,
  })
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    // 全局隐式转换会把数字变成字符串；用原始字段校验，不能把 123 当成昵称。
    return typeof obj.nickname === 'string' ? obj.nickname.trim() : obj.nickname
  })
  @IsString({ message: '用户名必须是字符串' })
  @Length(2, 24, { message: '用户名长度须在 2～24 个字符之间' })
  nickname: string
}

export class CustomerRefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsString()
  refreshToken: string
}

export class CustomerLogoutDto {
  @ApiPropertyOptional({ description: '刷新令牌' })
  @IsOptional()
  @IsString()
  refreshToken?: string
}

export class ResetPasswordDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138001',
  })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string

  @ApiProperty({
    description: '短信验证码',
    example: '123456',
  })
  @IsString()
  smsCode: string

  @ApiProperty({
    description: '新密码',
    example: 'new-password',
  })
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password: string
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import type { SmsScene } from '../../sms/sms-provider';

export class SendSmsDto {
  @ApiProperty({ description: '手机号', example: '13800138001' })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({ description: '验证码场景', enum: ['login', 'register', 'reset_password'] })
  @IsIn(['login', 'register', 'reset_password'])
  scene: SmsScene;
}

export class CustomerRegisterDto {
  @ApiProperty({ description: '手机号', example: '13800138001' })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({ description: '短信验证码', example: '123456' })
  @IsString()
  smsCode: string;

  @ApiPropertyOptional({ description: '密码', example: 'password123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class CustomerPasswordLoginDto {
  @ApiProperty({ description: '手机号', example: '13800138001' })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class CustomerSmsLoginDto {
  @ApiProperty({ description: '手机号', example: '13800138001' })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string;

  @ApiProperty({ description: '短信验证码', example: '123456' })
  @IsString()
  smsCode: string;
}

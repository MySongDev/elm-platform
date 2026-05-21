import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: '用户名', example: 'john_doe', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  username?: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: '手机号', example: '13800138000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}

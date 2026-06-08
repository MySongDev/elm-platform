import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(2)
  username: string

  @ApiProperty({
    description: '密码',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({
    description: '邮箱',
    example: 'john@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiProperty({
    description: '角色',
    example: 'user',
    required: false,
  })
  @IsIn(['admin', 'user', 'tenant_admin', 'shop_operator'])
  @IsOptional()
  role?: 'admin' | 'user' | 'tenant_admin' | 'shop_operator'

  @ApiProperty({
    description: '状态',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  status?: number

  @ApiProperty({
    description: '权限码',
    example: ['user:view'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  permissions?: string[]

  @ApiProperty({
    description: '所属租户 ID',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  tenantId?: number | null

  @ApiProperty({
    description: '数据范围',
    example: 'TENANT',
    required: false,
  })
  @IsIn(['ALL', 'TENANT', 'SHOP'])
  @IsOptional()
  dataScope?: 'ALL' | 'TENANT' | 'SHOP'

  @ApiProperty({
    description: '绑定店铺 ID 列表',
    example: ['1'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  boundShopIds?: string[]
}

export class UpdateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
    required: false,
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  username?: string

  @ApiProperty({
    description: '邮箱',
    example: 'john@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiProperty({
    description: '角色',
    example: 'user',
    required: false,
  })
  @IsIn(['admin', 'user', 'tenant_admin', 'shop_operator'])
  @IsOptional()
  role?: 'admin' | 'user' | 'tenant_admin' | 'shop_operator'

  @ApiProperty({
    description: '状态',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  status?: number

  @ApiProperty({
    description: '权限码',
    example: ['user:view'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  permissions?: string[]

  @ApiProperty({
    description: '所属租户 ID',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  tenantId?: number | null

  @ApiProperty({
    description: '数据范围',
    example: 'TENANT',
    required: false,
  })
  @IsIn(['ALL', 'TENANT', 'SHOP'])
  @IsOptional()
  dataScope?: 'ALL' | 'TENANT' | 'SHOP'

  @ApiProperty({
    description: '绑定店铺 ID 列表',
    example: ['1'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  boundShopIds?: string[]
}

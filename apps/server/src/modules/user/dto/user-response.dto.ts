import { ApiProperty } from '@nestjs/swagger'

export class UserResponseDto {
  @ApiProperty({
    description: '用户 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  username: string

  @ApiProperty({
    description: '邮箱',
    example: 'admin@example.com',
    nullable: true,
    type: String,
  })
  email: string | null

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    nullable: true,
    type: String,
  })
  phone: string | null

  @ApiProperty({
    description: '头像',
    nullable: true,
    type: String,
  })
  avatar: string | null

  @ApiProperty({
    description: '状态：1 启用 0 停用',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '角色',
    example: 'admin',
  })
  role: string

  @ApiProperty({
    description: '权限列表',
    type: [String],
    example: ['*:*:*'],
  })
  permissions: string[]

  @ApiProperty({
    description: '租户 ID',
    example: 1,
    nullable: true,
    type: Number,
  })
  tenantId: number | null

  @ApiProperty({
    description: '数据范围',
    example: 'ALL',
  })
  dataScope: string

  @ApiProperty({
    description: '绑定的店铺 ID 列表',
    type: [String],
    example: ['shop-1'],
  })
  boundShopIds: string[]

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date

  @ApiProperty({
    description: '更新时间',
    format: 'date-time',
  })
  updatedAt: Date
}

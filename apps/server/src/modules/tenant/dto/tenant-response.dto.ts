import { ApiProperty } from '@nestjs/swagger'
import { tenantStatuses } from '../tenant.types'

export class TenantCountResponseDto {
  @ApiProperty({
    description: '用户数',
    example: 5,
  })
  users: number

  @ApiProperty({
    description: '订单数',
    example: 100,
  })
  orders: number
}

export class TenantResponseDto {
  @ApiProperty({
    description: '租户 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '租户编码',
    example: 'default',
  })
  code: string

  @ApiProperty({
    description: '租户名称',
    example: 'Default Tenant',
  })
  name: string

  @ApiProperty({
    description: '租户状态',
    enum: tenantStatuses,
    example: 'ACTIVE',
  })
  status: string

  @ApiProperty({
    description: '联系人姓名',
    example: '张三',
    nullable: true,
    type: String,
  })
  contactName: string | null

  @ApiProperty({
    description: '联系人电话',
    example: '13800138000',
    nullable: true,
    type: String,
  })
  contactPhone: string | null

  @ApiProperty({
    description: '联系人邮箱',
    example: 'contact@example.com',
    nullable: true,
    type: String,
  })
  contactEmail: string | null

  @ApiProperty({
    description: '套餐编码',
    example: 'standard',
  })
  planCode: string

  @ApiProperty({
    description: '租户设置',
    example: {},
    nullable: true,
    type: Object,
  })
  settings: Record<string, unknown> | null

  @ApiProperty({
    description: '备注',
    example: '测试租户',
    nullable: true,
    type: String,
  })
  remark: string | null

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

  @ApiProperty({
    description: '可用操作',
    type: [String],
    example: ['SUSPEND', 'DISABLE'],
  })
  availableActions: string[]
}

export class TenantDetailResponseDto extends TenantResponseDto {
  @ApiProperty({
    description: '统计信息',
    type: TenantCountResponseDto,
  })
  _count: TenantCountResponseDto
}

export class TenantActionLogResponseDto {
  @ApiProperty({
    description: '日志 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '租户 ID',
    example: 1,
  })
  tenantId: number

  @ApiProperty({
    description: '事件类型',
    example: 'APPROVE',
  })
  event: string

  @ApiProperty({
    description: '变更前状态',
    example: 'PENDING',
  })
  fromStatus: string

  @ApiProperty({
    description: '变更后状态',
    example: 'ACTIVE',
  })
  toStatus: string

  @ApiProperty({
    description: '操作者 ID',
    example: '1',
  })
  actorId: string

  @ApiProperty({
    description: '操作者名称',
    example: 'admin',
  })
  actorName: string

  @ApiProperty({
    description: '操作者类型',
    example: 'PLATFORM_ADMIN',
  })
  actorType: string

  @ApiProperty({
    description: '原因',
    example: '审核通过',
    nullable: true,
    type: String,
  })
  reason: string | null

  @ApiProperty({
    description: '备注',
    example: '已核实',
    nullable: true,
    type: String,
  })
  remark: string | null

  @ApiProperty({
    description: '请求 ID',
    nullable: true,
    type: String,
  })
  requestId: string | null

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date
}

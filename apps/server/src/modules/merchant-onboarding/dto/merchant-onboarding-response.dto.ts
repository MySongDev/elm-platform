import { ApiProperty } from '@nestjs/swagger'
import {
  merchantApplicationReviewActions,
  merchantApplicationStatuses,
} from '../merchant-onboarding.types'

export class MerchantMaterialResponseDto {
  @ApiProperty({
    description: '材料 ID',
    example: 'mat-001',
  })
  id: string

  @ApiProperty({
    description: '材料名称',
    example: '营业执照',
  })
  name: string

  @ApiProperty({
    description: '材料类型',
    enum: ['image', 'pdf', 'file'],
    example: 'image',
  })
  type: 'image' | 'pdf' | 'file'

  @ApiProperty({
    description: '材料链接',
    example: 'https://example.com/license.jpg',
  })
  url: string
}

export class MerchantApplicationResponseDto {
  @ApiProperty({
    description: '申请 ID',
    example: 'app-001',
  })
  id: string

  @ApiProperty({
    description: '商户名称',
    example: '麦当劳',
  })
  merchantName: string

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
    description: '经营品类',
    example: '餐饮',
    nullable: true,
    type: String,
  })
  businessCategory: string | null

  @ApiProperty({
    description: '地址',
    example: '北京市朝阳区',
    nullable: true,
    type: String,
  })
  address: string | null

  @ApiProperty({
    description: '申请状态',
    enum: merchantApplicationStatuses,
    example: 'PENDING',
  })
  status: string

  @ApiProperty({
    description: '可用操作',
    type: [String],
    example: ['START_REVIEW'],
  })
  availableActions: string[]

  @ApiProperty({
    description: '申请材料列表',
    type: [MerchantMaterialResponseDto],
  })
  materials: MerchantMaterialResponseDto[]

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

export class MerchantApplicationActionLogResponseDto {
  @ApiProperty({
    description: '日志 ID',
    example: 'log-001',
  })
  id: string

  @ApiProperty({
    description: '事件类型',
    enum: merchantApplicationReviewActions,
    example: 'APPROVE',
  })
  event: string

  @ApiProperty({
    description: '变更前状态',
    example: 'UNDER_REVIEW',
  })
  fromStatus: string

  @ApiProperty({
    description: '变更后状态',
    example: 'APPROVED',
  })
  toStatus: string

  @ApiProperty({
    description: '操作者名称',
    example: 'admin',
  })
  actorName: string

  @ApiProperty({
    description: '原因',
    example: '资料齐全',
    nullable: true,
    type: String,
  })
  reason: string | undefined

  @ApiProperty({
    description: '备注',
    example: '已核实',
    nullable: true,
    type: String,
  })
  remark: string | undefined

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date
}

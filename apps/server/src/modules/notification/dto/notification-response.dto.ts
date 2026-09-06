import { ApiProperty } from '@nestjs/swagger'
import { NOTIFICATION_TYPES } from '../notification.service'

export class NotificationItemResponseDto {
  @ApiProperty({
    description: '通知 ID',
    example: 'cuid-001',
  })
  id: string

  @ApiProperty({
    description: '用户 ID',
    example: 1,
  })
  userId: number

  @ApiProperty({
    description: '通知类型',
    enum: NOTIFICATION_TYPES,
    example: 'notification',
  })
  type: string

  @ApiProperty({
    description: '标题',
    example: '安全登录提醒',
  })
  title: string

  @ApiProperty({
    description: '描述内容',
    example: '127.0.0.1（Chrome / Windows）',
    nullable: true,
    type: String,
  })
  description: string | null

  @ApiProperty({
    description: '是否已读',
    example: false,
  })
  read: boolean

  @ApiProperty({
    description: '来源',
    example: 'SECURITY_LOGIN',
  })
  source: string

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

export class UpdatedCountResponseDto {
  @ApiProperty({
    description: '已更新通知数量',
    example: 5,
  })
  updatedCount: number
}

export class DeletedCountResponseDto {
  @ApiProperty({
    description: '已删除通知数量',
    example: 10,
  })
  deletedCount: number
}

export class NotificationSuccessResponseDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean
}

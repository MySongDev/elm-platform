import type { AccountStatus } from '../../../../common/constants/account-status'
import { ApiProperty } from '@nestjs/swagger'
import { accountStatuses } from '../../../../common/constants/account-status'

export class RoleResponseDto {
  @ApiProperty({
    description: '角色 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '角色名称',
    example: '管理员',
  })
  name: string

  @ApiProperty({
    description: '角色编码',
    example: 'admin',
  })
  code: string

  @ApiProperty({
    description: '账号状态',
    enum: accountStatuses,
    example: 'ACTIVE',
  })
  status: AccountStatus

  @ApiProperty({
    description: '备注',
    nullable: true,
    type: String,
  })
  remark: string | null

  @ApiProperty({
    description: '权限码列表',
    type: [String],
    example: ['*:*:*'],
  })
  permissions: string[]

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date | string
}

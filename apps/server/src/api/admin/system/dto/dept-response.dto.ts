import type { AccountStatus } from '../../../../common/constants/account-status'
import { ApiProperty } from '@nestjs/swagger'
import { accountStatuses } from '../../../../common/constants/account-status'

export class DeptResponseDto {
  @ApiProperty({
    description: '部门 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '父部门 ID',
    nullable: true,
    type: Number,
  })
  parentId: number | null

  @ApiProperty({
    description: '部门名称',
    example: '技术部',
  })
  name: string

  @ApiProperty({
    description: '负责人',
    nullable: true,
    type: String,
  })
  leader: string | null

  @ApiProperty({
    description: '电话',
    nullable: true,
    type: String,
  })
  phone: string | null

  @ApiProperty({
    description: '邮箱',
    nullable: true,
    type: String,
  })
  email: string | null

  @ApiProperty({
    description: '排序号',
    example: 1,
  })
  sort: number

  @ApiProperty({
    description: '账号状态',
    enum: accountStatuses,
    example: 'ACTIVE',
  })
  status: AccountStatus

  @ApiProperty({
    description: '子部门列表',
    type: () => [DeptResponseDto],
    required: false,
  })
  children?: DeptResponseDto[]
}

import type { AccountStatus } from '../../../../common/constants/account-status'
import { ApiProperty } from '@nestjs/swagger'
import { accountStatuses } from '../../../../common/constants/account-status'

export class MenuResponseDto {
  @ApiProperty({
    description: '菜单 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '父菜单 ID',
    nullable: true,
    type: Number,
  })
  parentId: number | null

  @ApiProperty({
    description: '菜单标题',
    example: '用户管理',
  })
  title: string

  @ApiProperty({
    description: '菜单路径',
    example: '/system/user',
  })
  path: string

  @ApiProperty({
    description: '路由名称',
    nullable: true,
    type: String,
  })
  name: string | null

  @ApiProperty({
    description: '图标',
    nullable: true,
    type: String,
  })
  icon: string | null

  @ApiProperty({
    description: '权限标识',
    nullable: true,
    type: String,
  })
  permission: string | null

  @ApiProperty({
    description: '组件路径',
    nullable: true,
    type: String,
    example: 'system/user',
  })
  component: string | null

  @ApiProperty({
    description: '菜单类型',
    enum: ['catalog', 'menu', 'button'],
    example: 'menu',
  })
  type: string

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
    description: '子菜单列表',
    type: () => [MenuResponseDto],
    required: false,
  })
  children?: MenuResponseDto[]
}

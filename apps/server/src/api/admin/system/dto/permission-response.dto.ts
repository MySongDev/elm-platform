import { ApiProperty } from '@nestjs/swagger'

export class PagePermissionResponseDto {
  @ApiProperty({
    description: '页面路径',
    example: '/system/user',
  })
  path: string

  @ApiProperty({
    description: '路由名称',
    example: 'UserList',
  })
  name: string

  @ApiProperty({
    description: '页面标题',
    example: '用户管理',
  })
  title: string

  @ApiProperty({
    description: '角色列表',
    type: [String],
    example: ['admin'],
  })
  roles: string[]

  @ApiProperty({
    description: '权限码列表',
    type: [String],
    example: ['user:view'],
  })
  auths: string[]
}

export class ButtonPermissionResponseDto {
  @ApiProperty({
    description: '权限编码',
    example: 'user:view',
  })
  code: string

  @ApiProperty({
    description: '权限名称',
    example: '用户查看',
  })
  name: string

  @ApiProperty({
    description: '所属分组',
    example: '系统管理',
  })
  group: string
}

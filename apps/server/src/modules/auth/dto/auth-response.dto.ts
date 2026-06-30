import { ApiProperty } from '@nestjs/swagger'

export class AdminTenantResponseDto {
  @ApiProperty({
    description: '租户ID',
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
    example: 'ACTIVE',
  })
  status: string
}

export class AdminProfileResponseDto {
  @ApiProperty({
    description: '用户ID',
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
    description: '状态',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '角色',
    example: 'admin',
    enum: ['admin', 'user'],
  })
  role: string

  @ApiProperty({
    description: '权限列表',
    type: [String],
    example: ['*:*:*'],
  })
  permissions: string[]

  @ApiProperty({
    description: '数据范围',
    example: 'ALL',
  })
  dataScope: string

  @ApiProperty({
    description: '绑定的店铺ID列表',
    type: [String],
    example: ['shop-1'],
  })
  boundShopIds: string[]

  @ApiProperty({
    description: '所属租户',
    type: AdminTenantResponseDto,
    nullable: true,
  })
  tenant: AdminTenantResponseDto | null

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

export class AdminUpdatedProfileResponseDto {
  @ApiProperty({
    description: '用户ID',
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
    description: '状态',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '角色',
    example: 'admin',
    enum: ['admin', 'user'],
  })
  role: string

  @ApiProperty({
    description: '权限列表',
    type: [String],
    example: ['*:*:*'],
  })
  permissions: string[]

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

export class AdminMenuResponseDto {
  @ApiProperty({
    description: '菜单ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '父菜单ID',
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
    description: '菜单类型',
    enum: ['catalog', 'menu', 'button'],
    example: 'menu',
  })
  type: 'catalog' | 'menu' | 'button'

  @ApiProperty({
    description: '排序号',
    example: 1,
  })
  sort: number

  @ApiProperty({
    description: '状态',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '子菜单列表',
    type: () => [AdminMenuResponseDto],
    required: false,
  })
  children?: AdminMenuResponseDto[]
}

export class LogoutResponseDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean
}

export class SecurityLogItemResponseDto {
  @ApiProperty({
    description: '日志ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '用户ID',
    example: 1,
  })
  userId: number

  @ApiProperty({
    description: 'IP地址',
    example: '127.0.0.1',
  })
  ip: string | null

  @ApiProperty({
    description: '浏览器',
    example: 'Chrome',
  })
  browser: string

  @ApiProperty({
    description: '操作系统',
    example: 'Windows',
  })
  os: string

  @ApiProperty({
    description: '状态',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '消息',
    example: '登录成功',
  })
  message: string | null

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date
}

export class SecurityLogsResponseDto {
  @ApiProperty({
    description: '日志列表',
    type: [SecurityLogItemResponseDto],
  })
  list: SecurityLogItemResponseDto[]

  @ApiProperty({
    description: '总记录数',
    example: 100,
  })
  total: number

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page: number

  @ApiProperty({
    description: '每页条数',
    example: 10,
  })
  pageSize: number
}

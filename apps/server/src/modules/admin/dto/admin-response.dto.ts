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

export class OnlineUserResponseDto {
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
    description: '角色',
    example: 'admin',
  })
  role: string

  @ApiProperty({
    description: 'IP 地址',
    example: '127.0.0.1',
    nullable: true,
    type: String,
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
    description: '登录时间',
    format: 'date-time',
  })
  loginTime: string

  @ApiProperty({
    description: '最后活跃时间',
    format: 'date-time',
  })
  lastActiveAt: string
}

export class LoginLogResponseDto {
  @ApiProperty({
    description: '日志 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '用户 ID',
    example: 1,
  })
  userId: number

  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  username: string

  @ApiProperty({
    description: 'IP 地址',
    nullable: true,
    type: String,
  })
  ip: string | null

  @ApiProperty({
    description: '地址',
    nullable: true,
    type: String,
  })
  address: string | null

  @ApiProperty({
    description: '浏览器',
    nullable: true,
    type: String,
  })
  browser: string | null

  @ApiProperty({
    description: '操作系统',
    nullable: true,
    type: String,
  })
  os: string | null

  @ApiProperty({
    description: '状态：1 成功 0 失败',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '消息',
    nullable: true,
    type: String,
  })
  message: string | null

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date
}

export class OperationLogResponseDto {
  @ApiProperty({
    description: '日志 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  username: string

  @ApiProperty({
    description: '操作模块',
    example: '用户管理',
  })
  module: string

  @ApiProperty({
    description: '操作动作',
    example: '新增用户',
  })
  action: string

  @ApiProperty({
    description: '请求方法',
    example: 'POST',
  })
  method: string

  @ApiProperty({
    description: '请求路径',
    example: '/api/users',
  })
  path: string

  @ApiProperty({
    description: 'IP 地址',
    nullable: true,
    type: String,
  })
  ip: string | null

  @ApiProperty({
    description: '操作状态：1 成功 0 失败',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '持续时间（毫秒）',
    example: 120,
  })
  duration: number

  @ApiProperty({
    description: '租户 ID',
    nullable: true,
    type: Number,
  })
  tenantId: number | null

  @ApiProperty({
    description: '租户编码',
    nullable: true,
    type: String,
  })
  tenantCode: string | null

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: Date
}

export class SystemLogResponseDto {
  @ApiProperty({
    description: '日志 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '日志级别',
    example: 'info',
  })
  level: string

  @ApiProperty({
    description: '日志来源',
    example: 'NestJS',
  })
  source: string

  @ApiProperty({
    description: '日志消息',
    example: '后台管理服务运行中',
  })
  message: string

  @ApiProperty({
    description: '详细内容',
    nullable: true,
    type: String,
  })
  detail: string | null

  @ApiProperty({
    description: '创建时间',
    format: 'date-time',
  })
  createdAt: string | Date
}

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
    description: '状态：1 启用 0 停用',
    example: 1,
  })
  status: number

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
    description: '状态：1 启用 0 停用',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '子菜单列表',
    type: () => [MenuResponseDto],
    required: false,
  })
  children?: MenuResponseDto[]
}

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
    description: '状态：1 启用 0 停用',
    example: 1,
  })
  status: number

  @ApiProperty({
    description: '子部门列表',
    type: () => [DeptResponseDto],
    required: false,
  })
  children?: DeptResponseDto[]
}

export class SuccessResponseDto {
  @ApiProperty({
    description: '是否成功',
    example: true,
  })
  success: boolean
}

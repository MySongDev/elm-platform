import { ApiProperty } from '@nestjs/swagger'

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
    description: '登录结果消息，如登录成功、密码错误',
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

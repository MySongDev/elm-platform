import { ApiProperty } from '@nestjs/swagger'

export class HealthDependencyResponseDto {
  @ApiProperty({
    description: '依赖状态',
    enum: ['ok', 'error'],
    example: 'ok',
  })
  status: 'ok' | 'error'

  @ApiProperty({
    description: '详细说明',
    example: 'SELECT 1 ok',
  })
  detail: string
}

export class HealthDependenciesResponseDto {
  @ApiProperty({
    description: '数据库状态',
    type: HealthDependencyResponseDto,
  })
  database: HealthDependencyResponseDto

  @ApiProperty({
    description: 'Redis 状态',
    type: HealthDependencyResponseDto,
  })
  redis: HealthDependencyResponseDto
}

export class HealthResponseDto {
  @ApiProperty({
    description: '服务状态',
    enum: ['ok', 'degraded'],
    example: 'ok',
  })
  status: 'ok' | 'degraded'

  @ApiProperty({
    description: '检查时间',
    example: '2026-07-01T00:00:00.000Z',
    format: 'date-time',
  })
  timestamp: string

  @ApiProperty({
    description: '运行时长（秒）',
    example: 3600,
  })
  uptime: number

  @ApiProperty({
    description: '依赖状态',
    type: HealthDependenciesResponseDto,
  })
  dependencies: HealthDependenciesResponseDto
}

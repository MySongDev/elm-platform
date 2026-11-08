import type { AccountStatus } from '../../../../common/constants/account-status'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { accountStatuses } from '../../../../common/constants/account-status'

export class UpsertDeptDto {
  @ApiPropertyOptional({ description: 'ID（更新时传入）' })
  @IsInt()
  @IsOptional()
  id?: number

  @ApiPropertyOptional({ description: '父级部门 ID' })
  @IsInt()
  @IsOptional()
  parentId?: number | null

  @ApiPropertyOptional({ description: '部门名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '负责人' })
  @IsString()
  @IsOptional()
  leader?: string

  @ApiPropertyOptional({ description: '电话' })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ description: '邮箱' })
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: '排序' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number

  @ApiPropertyOptional({
    description: '账号状态',
    enum: accountStatuses,
  })
  @IsIn(accountStatuses)
  @IsOptional()
  status?: AccountStatus
}

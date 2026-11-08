import type { AccountStatus } from '../../../../common/constants/account-status'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator'
import { accountStatuses } from '../../../../common/constants/account-status'

export class UpsertRoleDto {
  @ApiPropertyOptional({ description: 'ID（更新时传入）' })
  @IsInt()
  @IsOptional()
  id?: number

  @ApiPropertyOptional({ description: '角色名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '角色编码' })
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional({
    description: '账号状态',
    enum: accountStatuses,
  })
  @IsIn(accountStatuses)
  @IsOptional()
  status?: AccountStatus

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string

  @ApiPropertyOptional({ description: '权限码列表' })
  @IsArray()
  @IsOptional()
  permissions?: string[]
}

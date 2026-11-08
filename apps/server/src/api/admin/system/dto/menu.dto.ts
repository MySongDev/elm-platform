import type { AccountStatus } from '../../../../common/constants/account-status'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { accountStatuses } from '../../../../common/constants/account-status'

export class UpsertMenuDto {
  @ApiPropertyOptional({ description: 'ID（更新时传入）' })
  @IsInt()
  @IsOptional()
  id?: number

  @ApiPropertyOptional({ description: '父级菜单 ID' })
  @IsInt()
  @IsOptional()
  parentId?: number | null

  @ApiPropertyOptional({ description: '菜单名称' })
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional({ description: '路由路径' })
  @IsString()
  @IsOptional()
  path?: string

  @ApiPropertyOptional({ description: '路由名称' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '图标' })
  @IsString()
  @IsOptional()
  icon?: string

  @ApiPropertyOptional({ description: '权限标识' })
  @IsString()
  @IsOptional()
  permission?: string

  @ApiPropertyOptional({ description: '组件路径' })
  @IsString()
  @IsOptional()
  component?: string

  @ApiPropertyOptional({ description: '菜单类型' })
  @IsIn(['catalog', 'menu', 'button'])
  @IsOptional()
  type?: 'catalog' | 'menu' | 'button'

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

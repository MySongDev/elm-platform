import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

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

  @ApiPropertyOptional({ description: '状态：1启用 0停用' })
  @IsInt()
  @IsOptional()
  status?: number

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string

  @ApiPropertyOptional({ description: '权限码列表' })
  @IsArray()
  @IsOptional()
  permissions?: string[]
}

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

  @ApiPropertyOptional({ description: '菜单类型' })
  @IsIn(['catalog', 'menu', 'button'])
  @IsOptional()
  type?: 'catalog' | 'menu' | 'button'

  @ApiPropertyOptional({ description: '排序' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number

  @ApiPropertyOptional({ description: '状态：1启用 0停用' })
  @IsInt()
  @IsOptional()
  status?: number
}

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

  @ApiPropertyOptional({ description: '状态：1启用 0停用' })
  @IsInt()
  @IsOptional()
  status?: number
}

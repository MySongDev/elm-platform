import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

/** 分类分页必须在 HTTP 边界拒绝非法数值，不能把 NaN/负数交给 Prisma。 */
export class CategoryFoodsQueryDto {
  @ApiProperty({
    description: '所属餐馆 ID',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  restaurant_id: number

  @ApiPropertyOptional({
    description: '已读取条数',
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  offset: number = 0

  @ApiPropertyOptional({
    description: '每页条数，最多 50 条',
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator'

export class CreateCustomerAddressDto {
  @ApiProperty({
    description: '收货人姓名',
    example: '张三',
  })
  @IsString()
  @MaxLength(30)
  name: string

  @ApiProperty({
    description: '联系电话',
    example: '13800138000',
  })
  @Matches(/^1\d{10}$/, { message: '请输入正确的手机号' })
  phone: string

  @ApiPropertyOptional({
    description: '备用电话',
    example: '13900139000',
  })
  @IsOptional()
  @Matches(/^1\d{10}$/, { message: '请输入正确的备用电话' })
  phoneBk?: string

  @ApiProperty({
    description: '地址',
    example: '桂平路180号33幢',
  })
  @IsString()
  @MaxLength(120)
  address: string

  @ApiProperty({
    description: '详细地址',
    example: 'A座101室',
  })
  @IsString()
  @MaxLength(120)
  addressDetail: string

  @ApiPropertyOptional({
    description: '经纬度，格式为“纬度,经度”',
    example: '31.22967,121.4762',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  geohash?: string

  @ApiPropertyOptional({
    description: '性别：1 先生，2 女士',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsIn([1, 2])
  sex?: number

  @ApiPropertyOptional({
    description: '地址标签',
    example: '家',
    default: '家',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tag?: string

  @ApiPropertyOptional({
    description: '标签类型',
    example: 2,
    default: 2,
  })
  @IsOptional()
  @IsIn([0, 1, 2, 3, 4])
  tagType?: number

  @ApiPropertyOptional({
    description: '兴趣点类型',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsIn([0, 1, 2, 3])
  poiType?: number
}

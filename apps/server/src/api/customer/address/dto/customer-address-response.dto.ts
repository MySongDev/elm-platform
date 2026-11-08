import { ApiProperty } from '@nestjs/swagger'

export class CustomerAddressResponseDto {
  @ApiProperty({
    description: '地址 ID',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: '所属用户 ID',
    example: 1,
  })
  customerId: number

  @ApiProperty({
    description: '收货人姓名',
    example: '张三',
  })
  name: string

  @ApiProperty({
    description: '联系电话',
    example: '13800138000',
  })
  phone: string

  @ApiProperty({
    description: '备用电话',
    example: '13900139000',
    nullable: true,
    type: String,
  })
  phoneBk: string | null

  @ApiProperty({
    description: '地址',
    example: '桂平路180号33幢',
  })
  address: string

  @ApiProperty({
    description: '详细地址',
    example: 'A座101室',
  })
  addressDetail: string

  @ApiProperty({
    description: '经纬度，格式为“纬度,经度”',
    example: '31.22967,121.4762',
  })
  geohash: string

  @ApiProperty({
    description: '性别：1 先生，2 女士',
    example: 1,
  })
  sex: number

  @ApiProperty({
    description: '地址标签',
    example: '家',
  })
  tag: string

  @ApiProperty({
    description: '标签类型',
    example: 2,
  })
  tagType: number

  @ApiProperty({
    description: '兴趣点类型',
    example: 0,
  })
  poiType: number
}

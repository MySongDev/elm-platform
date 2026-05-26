import { Type } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

export class PaymentCartItemDto {
  @IsOptional()
  @IsString()
  shopId?: string

  @IsOptional()
  @IsString()
  shopName?: string

  @IsOptional()
  @IsString()
  itemId?: string

  @IsOptional()
  @IsString()
  id?: string

  @IsOptional()
  @IsString()
  skuId?: string

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  name?: string

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  qty!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number
}

export class CreateAlipayWapPaymentDto {
  @IsOptional()
  @IsString()
  shopId?: string

  @IsOptional()
  @IsString()
  shopName?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee = 0

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentCartItemDto)
  cartItems!: PaymentCartItemDto[]
}

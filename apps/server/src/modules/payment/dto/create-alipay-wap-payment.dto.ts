import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

/**
 * 订单购物车项。
 *
 * 这是"下单"这个领域概念的入参，被两个建单入口共用：
 * `CreateAlipayWapPaymentDto`（支付宝 WAP 建单）与 `CreateOrderDto`（渠道无关建单）。
 *
 * ⚠️ 每个字段都同时接受两套名字（`itemId`/`id`、`title`/`name`、`skuId`），
 * 因为前端购物车项来自不同来源、字段名不统一；归一化在
 * `order/order-draft.factory.ts` 的 `normalizeOrderCartItem()` 里做（统一收敛到 `itemId`/`title`/`skuId`）。
 * 所以这里除 `qty`/`unitPrice` 外全部 `@IsOptional()`，真正的"项是否有效"由归一化后的过滤决定。
 *
 * ## 关于 `@ApiProperty`
 *
 * 本仓库未启用 `@nestjs/swagger` CLI 插件，class-validator 装饰器不会被自动翻译成 OpenAPI schema。
 * 下面的注解是纯文档元数据（不参与校验、不影响运行时），
 * 加上是为了让 `POST /api/orders` 的 `cartItems` 契约对 uni-user 可读可用，
 * 否则生成出来会是空的 `{ type: 'object', properties: {} }`。
 */
export class PaymentCartItemDto {
  @ApiProperty({
    description: '所属店铺 ID（前端购物车项可能自带，建单时以顶层 shopId 为准）',
    example: '1',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  shopId?: string

  @ApiProperty({
    description: '所属店铺名称',
    example: '鲜花蛋糕旗舰店',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  shopName?: string

  @ApiProperty({
    description: '商品项 ID（与 id 二选一，归一化后统一写入 itemId）',
    example: '1001',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  itemId?: string

  @ApiProperty({
    description: '商品项 ID 的兼容字段名（等价于 itemId）',
    example: '1001',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  id?: string

  @ApiProperty({
    description: 'SKU ID，缺省时回退为 itemId/id',
    example: '1001',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  skuId?: string

  @ApiProperty({
    description: '商品标题（与 name 二选一，归一化后统一写入 title）',
    example: '经典香辣鸡腿堡套餐',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({
    description: '商品标题的兼容字段名（等价于 title）',
    example: '经典香辣鸡腿堡套餐',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({
    description: '数量，必须为正整数；qty <= 0 的项会在归一化时被丢弃',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  qty!: number

  @ApiProperty({
    description: '单价，必须 > 0；unitPrice <= 0 的项会在归一化时被丢弃',
    example: 19.9,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number
}

export class CreateAlipayWapPaymentDto {
  @ApiProperty({
    description: '店铺 ID，用于解析订单归属的租户',
    example: '1',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  shopId?: string

  @ApiProperty({
    description: '店铺名称，缺省时落库为「饿了么订单」',
    example: '鲜花蛋糕旗舰店',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  shopName?: string

  @ApiProperty({
    description: '配送费，计入应付金额',
    example: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFee = 0

  @ApiProperty({
    description: '购物车商品列表，至少一项且每项 qty > 0、unitPrice > 0',
    isArray: true,
    type: () => PaymentCartItemDto,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentCartItemDto)
  cartItems!: PaymentCartItemDto[]
}

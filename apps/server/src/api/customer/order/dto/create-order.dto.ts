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
import { PaymentCartItemDto } from '../../payment/dto/create-alipay-wap-payment.dto'

/**
 * `POST /api/orders` 的请求体：建单所需的购物车内容。
 *
 * 字段与 `CreateAlipayWapPaymentDto` 一致（这是刻意的）：两个建单入口收到的是同一份前端购物车结构，
 * 校验规则也必须一致，否则同一个购物车在一个入口能下单、在另一个入口被拒。
 * 这里不继承而是平铺字段，是为了让 OpenAPI 里 `/api/orders` 的 schema 名字与渠道无关
 * （uni-user 会直接消费这份契约），而不是引用一个带 `Alipay` 字样的类型。
 *
 * 购物车项复用 `PaymentCartItemDto`：它的字段校验是"订单购物车项"这个领域概念，
 * 只是历史上先随支付宝建单端点落地才放在 payment 模块下，此处不复制一份以免漂移。
 *
 * ⚠️ 不接受 `userId`：全局 `ValidationPipe` 开了 `forbidNonWhitelisted`，
 * 客户端传 `userId` 会直接 400。下单人一律由 `CustomerAuthGuard` 从 token 解析后注入。
 *
 * ## 为什么这里写了显式 `@ApiProperty`
 *
 * 本仓库**没有**启用 `@nestjs/swagger` 的 CLI 插件（`apps/server/nest-cli.json` 里没有 `plugins` 配置），
 * 所以 class-validator 装饰器不会被自动翻译成 OpenAPI schema —— 不写 `@ApiProperty` 的话，
 * 生成的 schema 会是空的 `{ type: 'object', properties: {} }`
 * （仓库里既有的 `CreateAlipayWapPaymentDto` 正是如此，见 `packages/api-types/openapi.json`）。
 *
 * `@ApiProperty` 是纯文档元数据，不参与校验，因此不影响运行时行为。
 * 新端点的契约要给 uni-user 照着实现，所以这里显式补齐；
 * ⚠️ 已知残留：嵌套的 `cartItems` 数组元素类型仍引用未加注解的 `PaymentCartItemDto`，
 * 其 items schema 因此是空的。要彻底补齐需给该 DTO 也加 `@ApiProperty`（属 payment 模块既有资产），
 * 或启用 swagger CLI 插件一次性解决全仓库，两者都不在本次改动范围内。
 */
export class CreateOrderDto {
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

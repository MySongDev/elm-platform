import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

/**
 * 微信建单的商品选择项。
 *
 * ⚠️ 只接受「买什么、买几份」，不接受单价/金额——金额一律由服务端按数据库查价，
 * 客户端传价格会被 `ValidationPipe` 的 `forbidNonWhitelisted` 直接 400。
 */
export class WechatCheckoutItemDto {
  @ApiProperty({
    description: '商品项 ID（本地目录正整数）',
    example: '11',
  })
  @IsString()
  @Matches(/^[1-9]\d{0,9}$/)
  itemId: string

  @ApiProperty({
    description: 'SKU ID（对应数据库 specfoods 的真实身份）',
    example: '111',
  })
  @IsString()
  @Length(1, 128)
  skuId: string

  @ApiProperty({
    description: '数量，1–99',
    example: 2,
  })
  @IsInt()
  @Min(1)
  qty: number
}

/** `POST /api/payments/wechat/create` 请求体：请求 ID + 单商家选择。用户身份来自 JWT。 */
export class CreateWechatOrderDto {
  @ApiProperty({
    description: '客户端生成的结算请求 ID，用于重试幂等；同一 ID + 同一选择返回原单',
    example: 'req-2026-11-12-0001',
  })
  @IsString()
  @Length(1, 128)
  requestId: string

  @ApiProperty({
    description: '店铺 ID（本地目录正整数）',
    example: '1',
  })
  @IsString()
  @Matches(/^[1-9]\d{0,9}$/)
  shopId: string

  @ApiProperty({
    description: '购物车商品选择；单商家、每 SKU 与整单数量均 ≤99',
    isArray: true,
    type: () => WechatCheckoutItemDto,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(99)
  @ValidateNested({ each: true })
  @Type(() => WechatCheckoutItemDto)
  cartItems: WechatCheckoutItemDto[]
}

/** `POST /api/payments/wechat/resume` 请求体：已建单号 + 一次性登录 code。 */
export class ResumeWechatPaymentDto {
  @ApiProperty({
    description: '已建订单号',
    example: 'ELMALI202611120001',
  })
  @IsString()
  @Length(1, 64)
  orderNo: string

  @ApiProperty({
    description: 'uni.login 拿到的一次性 code，仅用于服务端换 openid，不保存',
    example: '081AbCd000xyz',
  })
  @IsString()
  @MaxLength(128)
  code: string
}

/** 调起微信支付所需的五参数（微信小程序 requestPayment 入参）。 */
export class WechatPaymentParamsDto {
  @ApiProperty({
    description: '时间戳（秒级字符串）',
    example: '1794441600',
  })
  timeStamp: string

  @ApiProperty({
    description: '随机字符串',
    example: 'a1b2c3d4e5f6',
  })
  nonceStr: string

  @ApiProperty({
    description: 'prepay_id=xxx',
    example: 'prepay_id=wx1234567890',
  })
  package: string

  @ApiProperty({
    description: '签名类型，固定 RSA',
    example: 'RSA',
  })
  signType: string

  @ApiProperty({
    description: 'RSA 签名值',
    example: 'SU1H1...',
  })
  paySign: string
}

export class WechatPaymentResponseDto {
  @ApiProperty({
    description: '订单号',
    example: 'ELMALI202611120001',
  })
  orderNo: string

  @ApiProperty({
    description: '应付金额（元）',
    example: 29,
  })
  payableAmount: number

  @ApiProperty({
    description: '微信调起支付参数',
    type: () => WechatPaymentParamsDto,
  })
  paymentParams: WechatPaymentParamsDto
}

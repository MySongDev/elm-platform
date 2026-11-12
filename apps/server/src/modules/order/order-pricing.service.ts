import type { CheckoutCartItem, CheckoutSelection } from './checkout-selection'
import type { Food, Prisma } from '@/generated/prisma/client'
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { assertCatalogId, normalizeCheckoutSelection } from './checkout-selection'
import { addOrderAmountsMinor, multiplyOrderAmountMinor, orderMajorToMinor } from './order-money'

export interface PricedCheckoutCartItem extends CheckoutCartItem {
  title: string
  unitPriceMinor: number
  totalPriceMinor: number
}

export interface PricedCheckoutSelection {
  shopId: string
  shopName: string
  tenantId: number | null
  cartItems: PricedCheckoutCartItem[]
  goodsAmountMinor: number
  deliveryFeeMinor: number
  payableAmountMinor: number
}

type PricingFood = Pick<Food, 'itemId' | 'restaurantId' | 'name' | 'specfoods'>
type SpecFood = Prisma.JsonObject

function asSpecFood(value: Prisma.JsonValue): SpecFood | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null
  return value
}

/** 上游优先 sku_id，旧本地菜单只有 item_id；没有真实身份的条目不能拿数组下标冒充 SKU。 */
function getSpecIdentity(spec: SpecFood): string | null {
  const id = spec.sku_id ?? spec.food_id ?? spec.item_id
  if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
    return String(id)
  if (typeof id === 'string' && id.length && id.trim() === id)
    return id
  return null
}

function findSelectedSpec(food: PricingFood, item: CheckoutCartItem, restaurantId: number): SpecFood {
  if (!Array.isArray(food.specfoods))
    throw new InternalServerErrorException('商品规格数据无效，暂时无法结算')
  const matches = food.specfoods
    .map(asSpecFood)
    .filter((spec): spec is SpecFood => spec !== null && getSpecIdentity(spec) === item.skuId)
  if (!matches.length)
    throw new BadRequestException('所选商品规格不存在，请重新结算')
  if (matches.length !== 1)
    throw new InternalServerErrorException('商品规格身份重复，暂时无法结算')

  const spec = matches[0]
  if ((spec.item_id !== undefined && String(spec.item_id) !== item.itemId)
    || (spec.restaurant_id !== undefined && String(spec.restaurant_id) !== String(restaurantId))) {
    throw new BadRequestException('商品规格不属于当前商品或商家')
  }
  if (spec.sold_out === true)
    throw new BadRequestException('所选商品规格已售罄，请重新结算')
  return spec
}

function readPriceMinor(value: unknown): number {
  try {
    return orderMajorToMinor(value)
  }
  catch (error) {
    if (!(error instanceof RangeError))
      throw error
    throw new InternalServerErrorException('商家金额数据无效，暂时无法结算')
  }
}

@Injectable()
export class OrderPricingService {
  constructor(private readonly prisma: PrismaService) {}

  /** 只生成当前目录的可信报价快照，不写订单；重试原单必须先复用已落库快照，不能调用这里重算。 */
  async priceSelection(input: CheckoutSelection): Promise<PricedCheckoutSelection> {
    let selection: ReturnType<typeof normalizeCheckoutSelection>
    try {
      selection = normalizeCheckoutSelection(input)
    }
    catch (error) {
      if (!(error instanceof RangeError))
        throw error
      throw new BadRequestException(error.message)
    }

    const restaurantId = assertCatalogId(selection.shopId)
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        name: true,
        status: true,
        tenantId: true,
        floatDeliveryFee: true,
        floatMinimumOrderAmount: true,
      },
    })
    if (!restaurant)
      throw new NotFoundException('商家不存在，请重新结算')
    // 本地创建及导入默认状态都是 1；只放行这个已知状态，不把它解释成实时营业或库存保证。
    if (restaurant.status !== 1)
      throw new BadRequestException('商家当前不可结算')

    const foods = await this.prisma.food.findMany({
      where: {
        restaurantId,
        itemId: { in: [...new Set(selection.cartItems.map(item => assertCatalogId(item.itemId)))] },
      },
      select: {
        itemId: true,
        restaurantId: true,
        name: true,
        specfoods: true,
      },
    })
    const foodById = new Map(foods.map(food => [String(food.itemId), food]))
    const cartItems = selection.cartItems.map((item) => {
      const food = foodById.get(item.itemId)
      if (!food || food.restaurantId !== restaurantId)
        throw new BadRequestException('商品不存在或不属于当前商家')
      const spec = findSelectedSpec(food, item, restaurantId)
      const unitPriceMinor = readPriceMinor(spec.price)
      return {
        ...item,
        title: food.name,
        unitPriceMinor,
        totalPriceMinor: this.calculateWithinOrderLimit(() => multiplyOrderAmountMinor(unitPriceMinor, item.qty)),
      }
    })

    const goodsAmountMinor = this.calculateWithinOrderLimit(() => addOrderAmountsMinor(...cartItems.map(item => item.totalPriceMinor)))
    const deliveryFeeMinor = readPriceMinor(restaurant.floatDeliveryFee)
    const minimumOrderMinor = readPriceMinor(restaurant.floatMinimumOrderAmount)
    if (goodsAmountMinor < minimumOrderMinor)
      throw new BadRequestException('商品金额未达到商家起送金额')
    const payableAmountMinor = this.calculateWithinOrderLimit(() => addOrderAmountsMinor(goodsAmountMinor, deliveryFeeMinor))
    if (payableAmountMinor <= 0)
      throw new BadRequestException('订单应付金额必须大于零')

    return {
      shopId: selection.shopId,
      shopName: restaurant.name,
      tenantId: restaurant.tenantId,
      cartItems,
      goodsAmountMinor,
      deliveryFeeMinor,
      payableAmountMinor,
    }
  }

  private calculateWithinOrderLimit(calculate: () => number): number {
    try {
      return calculate()
    }
    catch (error) {
      if (!(error instanceof RangeError))
        throw error
      throw new BadRequestException('订单金额超过允许上限')
    }
  }
}

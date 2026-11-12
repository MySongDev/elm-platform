import type { CheckoutSelection } from './checkout-selection'
import type { Food, Prisma, Restaurant } from '@/generated/prisma/client'
import type { PrismaService } from '@/prisma/prisma.service'
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { OrderPricingService } from './order-pricing.service'

type PricingRestaurant = Pick<Restaurant, 'name' | 'status' | 'tenantId' | 'floatDeliveryFee' | 'floatMinimumOrderAmount'>
type PricingFood = Pick<Food, 'itemId' | 'restaurantId' | 'name' | 'specfoods'>

function createFood(specOverrides: Prisma.JsonObject = {}, foodOverrides: Partial<PricingFood> = {}): PricingFood {
  return {
    itemId: 11,
    restaurantId: 1,
    name: '服务端商品',
    specfoods: [{
      sku_id: 111,
      food_id: 1001,
      item_id: 11,
      restaurant_id: 1,
      price: 12.34,
      sold_out: false,
      ...specOverrides,
    }],
    ...foodOverrides,
  }
}

function createService(restaurantOverrides: Partial<PricingRestaurant> = {}, foods: PricingFood[] = [createFood()]) {
  const prisma = {
    restaurant: {
      findUnique: jest.fn().mockResolvedValue({
        name: '服务端商家',
        tenantId: 7,
        status: 1,
        floatDeliveryFee: 2.35,
        floatMinimumOrderAmount: 20,
        ...restaurantOverrides,
      }),
    },
    food: {
      findMany: jest.fn().mockResolvedValue(foods),
    },
  }
  return {
    service: new OrderPricingService(prisma as unknown as PrismaService),
    prisma,
  }
}

function selection(qty = 2, skuId = '111'): CheckoutSelection {
  return {
    shopId: '1',
    cartItems: [{
      itemId: '11',
      skuId,
      qty,
    }],
  }
}

describe('服务端可信订单报价', () => {
  it('忽略客户端报价、标题和配送费，返回真实归属及整数分快照', async () => {
    const { service, prisma } = createService()
    const input = {
      ...selection(),
      shopName: '伪造商家',
      deliveryFee: 0,
      cartItems: [{
        ...selection().cartItems[0],
        title: '伪造商品',
        unitPrice: 0.01,
        totalPrice: 0.02,
        unitPriceMinor: 1,
      }],
    }
    expect(await service.priceSelection(input)).toEqual({
      shopId: '1',
      shopName: '服务端商家',
      tenantId: 7,
      cartItems: [{
        itemId: '11',
        skuId: '111',
        qty: 2,
        title: '服务端商品',
        unitPriceMinor: 1234,
        totalPriceMinor: 2468,
      }],
      goodsAmountMinor: 2468,
      deliveryFeeMinor: 235,
      payableAmountMinor: 2703,
    })
    expect(prisma.food.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        restaurantId: 1,
        itemId: { in: [11] },
      },
    }))
  })

  it('重复商品先合并成一次快照，数量相同不重复收费', async () => {
    const { service } = createService()
    const item = selection(1).cartItems[0]
    const result = await service.priceSelection({
      shopId: '1',
      cartItems: [item, item],
    })
    expect(result.cartItems).toHaveLength(1)
    expect(result.cartItems[0].qty).toBe(2)
    expect(result.payableAmountMinor).toBe(2703)
  })

  it('非法数量在查询数据库之前拒绝', async () => {
    const { service, prisma } = createService()
    await expect(service.priceSelection(selection(0))).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.restaurant.findUnique).not.toHaveBeenCalled()
  })

  it('拒绝不存在或外店的商品，以及本店其他商品的SKU', async () => {
    const { service: missing } = createService({}, [])
    await expect(missing.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
    const { service: otherShop } = createService({}, [createFood({}, { restaurantId: 2 })])
    await expect(otherShop.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
    const { service: otherSku } = createService()
    await expect(otherSku.priceSelection(selection(2, '999'))).rejects.toBeInstanceOf(BadRequestException)
  })

  it.each([
    { restaurant_id: 2 },
    { item_id: 12 },
    { sold_out: true },
  ])('拒绝SKU归属错位或目录明确标记售罄 %p', async (specOverride) => {
    const { service } = createService({}, [createFood(specOverride)])
    await expect(service.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
  })

  it('旧本地单规格只能使用specfoods真实item_id，不接受虚构的规格下标', async () => {
    const { service } = createService({}, [createFood({}, {
      specfoods: [{
        name: '本地商品',
        item_id: 11,
        restaurant_id: 1,
        price: 12.34,
      }],
    })])
    expect((await service.priceSelection(selection(2, '11'))).goodsAmountMinor).toBe(2468)
    await expect(service.priceSelection(selection(2, '0'))).rejects.toBeInstanceOf(BadRequestException)
  })

  it('没有sku_id的历史规格可使用真实food_id，但不能绕过已有sku_id', async () => {
    const { service } = createService({}, [createFood({ sku_id: null })])
    expect((await service.priceSelection(selection(2, '1001'))).goodsAmountMinor).toBe(2468)
    const { service: skuService } = createService()
    await expect(skuService.priceSelection(selection(2, '1001'))).rejects.toBeInstanceOf(BadRequestException)
  })

  it('规格身份重复或缺少身份时不猜一个价格', async () => {
    const spec = {
      sku_id: 111,
      price: 12.34,
    }
    const { service: duplicate } = createService({}, [createFood({}, { specfoods: [spec, spec] })])
    await expect(duplicate.priceSelection(selection())).rejects.toBeInstanceOf(InternalServerErrorException)
    const { service: noIdentity } = createService({}, [createFood({}, { specfoods: [{ price: 12.34 }] })])
    await expect(noIdentity.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
  })

  it('多规格只有相同item_id时拒绝选择，不能把第一项价格当成正确SKU', async () => {
    const { service } = createService({}, [createFood({}, {
      specfoods: [
        {
          item_id: 11,
          restaurant_id: 1,
          price: 12.34,
        },
        {
          item_id: 11,
          restaurant_id: 1,
          price: 20,
        },
      ],
    })])
    await expect(service.priceSelection(selection(2, '11'))).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it.each([0, 2, -1])('商家非已知可用状态 %s 不允许结算', async (status) => {
    const { service, prisma } = createService({ status })
    await expect(service.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.food.findMany).not.toHaveBeenCalled()
  })

  it('商家不存在时明确拒绝，平台自营保留null租户', async () => {
    const { service, prisma } = createService({ tenantId: null })
    expect((await service.priceSelection(selection())).tenantId).toBeNull()
    prisma.restaurant.findUnique.mockResolvedValueOnce(null)
    await expect(service.priceSelection(selection())).rejects.toBeInstanceOf(NotFoundException)
  })

  it('起送额只比较商品金额，配送费不能帮助凑起送额', async () => {
    const { service } = createService({ floatDeliveryFee: 100 })
    await expect(service.priceSelection(selection(1))).rejects.toBeInstanceOf(BadRequestException)
    const { service: exactMinimum } = createService({ floatMinimumOrderAmount: 24.68 })
    expect((await exactMinimum.priceSelection(selection())).goodsAmountMinor).toBe(2468)
  })

  it.each([null, -1, 0.001, '坏价格'])('权威SKU价格 %p 无效时拒绝，不静默归零', async (price) => {
    const { service } = createService({}, [createFood({ price })])
    await expect(service.priceSelection(selection())).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it('配送费与起送额的数据精度无效也必须阻断', async () => {
    const { service: delivery } = createService({ floatDeliveryFee: 0.001 })
    await expect(delivery.priceSelection(selection())).rejects.toBeInstanceOf(InternalServerErrorException)
    const { service: minimum } = createService({ floatMinimumOrderAmount: -1 })
    await expect(minimum.priceSelection(selection())).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it('规格小计或加配送费后超出存储上限时拒绝结算', async () => {
    const { service: subtotal } = createService({}, [createFood({ price: '99999999.99' })])
    await expect(subtotal.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
    const { service: payable } = createService({
      floatMinimumOrderAmount: 0,
      floatDeliveryFee: 0.01,
    }, [createFood({ price: '99999999.99' })])
    await expect(payable.priceSelection(selection(1))).rejects.toBeInstanceOf(BadRequestException)
  })

  it('零商品金额且零配送费不能形成零元支付订单', async () => {
    const { service } = createService({
      floatMinimumOrderAmount: 0,
      floatDeliveryFee: 0,
    }, [createFood({ price: 0 })])
    await expect(service.priceSelection(selection())).rejects.toBeInstanceOf(BadRequestException)
  })
})

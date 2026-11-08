import { rawResponse } from '@common/interceptors/transform.interceptor'
import { OrderController } from '@/api/customer/order/customer-order.controller'

function createController() {
  const orderWorkflow = {
    createOrder: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      status: 'PENDING',
      fulfillmentStatus: 'PENDING_PAYMENT',
      payableAmount: 29,
    }),
  } as any

  return {
    controller: new OrderController(orderWorkflow, {} as any),
    orderWorkflow,
  }
}

describe('orderController', () => {
  const request = {
    user: {
      id: '42',
    },
  }

  it('creates an order with only the authenticated customer id trusted by the workflow service', async () => {
    const { controller, orderWorkflow } = createController()

    const result = await controller.createOrder({
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    } as any, request)

    expect(orderWorkflow.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      userId: '42',
      shopId: '101',
      deliveryFee: 5,
    }))
    expect(result).toEqual(rawResponse({
      orderNo: 'ELMALI202605241200000001',
      status: 'PENDING',
      fulfillmentStatus: 'PENDING_PAYMENT',
      payableAmount: 29,
    }))
  })

  it('never lets a client supplied userId override the authenticated customer', async () => {
    const { controller, orderWorkflow } = createController()

    // 客户端伪造 userId 时，落库的下单人必须仍是 token 里的 42
    await controller.createOrder({
      userId: '999',
      shopId: '101',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    } as any, request)

    expect(orderWorkflow.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      userId: '42',
    }))
  })
})

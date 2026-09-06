import { rawResponse } from '../../common/interceptors/transform.interceptor'
import { PaymentController } from './payment.controller'

function createController() {
  const paymentService = {
    createAlipayWapPayment: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
      payableAmount: 29,
    }),
    resumeAlipayWapPayment: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
      payableAmount: 29,
    }),
    getAlipayPaymentStatus: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      status: 'PENDING',
    }),
    listOrders: jest.fn().mockResolvedValue({
      orders: [],
    }),
  } as any

  const orderWorkflow = {
    requestRefund: jest.fn().mockResolvedValue({
      orderNo: 'ELMALI202605241200000001',
      refundStatus: 'REQUESTED',
    }),
  } as any

  return {
    controller: new PaymentController(paymentService, orderWorkflow),
    paymentService,
    orderWorkflow,
  }
}

describe('paymentController', () => {
  const request = {
    user: {
      id: '42',
    },
  }

  it('creates an Alipay WAP payment with the authenticated user and returns the raw awaited payload', async () => {
    const { controller, paymentService } = createController()

    const result = await controller.createAlipayWapPayment({
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    } as any, request)

    expect(paymentService.createAlipayWapPayment).toHaveBeenCalledWith(expect.objectContaining({
      userId: '42',
      shopId: '101',
    }))
    expect(result).toEqual(rawResponse({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
      payableAmount: 29,
    }))
  })

  it('resumes an Alipay WAP payment with only the authenticated user id trusted by the service', async () => {
    const { controller, paymentService } = createController()

    const result = await controller.resumeAlipayWapPayment({
      orderNo: 'ELMALI202605241200000001',
    } as any, request)

    expect(paymentService.resumeAlipayWapPayment).toHaveBeenCalledWith({
      orderNo: 'ELMALI202605241200000001',
      userId: '42',
    })
    expect(result).toEqual(rawResponse({
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do?method=alipay.trade.wap.pay',
      payableAmount: 29,
    }))
  })

  it('lists only the authenticated user payment orders as a raw awaited payload', async () => {
    const { controller, paymentService } = createController()

    const result = await controller.listOrders(request, '20')

    expect(paymentService.listOrders).toHaveBeenCalledWith('42', '20')
    expect(result).toEqual(rawResponse({
      orders: [],
    }))
  })

  it('requests refund with only the authenticated customer id trusted by the workflow service', async () => {
    const { controller, orderWorkflow } = createController()

    const result = await controller.requestRefund('ELMALI202605241200000001', {
      reason: '不想要了',
    }, request)

    expect(orderWorkflow.requestRefund).toHaveBeenCalledWith('ELMALI202605241200000001', {
      userId: '42',
      reason: '不想要了',
      operator: {
        operatorId: '42',
        operatorName: 'customer#42',
        operatorType: 'CUSTOMER',
      },
    })
    expect(result).toEqual(rawResponse({
      orderNo: 'ELMALI202605241200000001',
      refundStatus: 'REQUESTED',
    }))
  })
})

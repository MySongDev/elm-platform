/* eslint-disable perfectionist/sort-imports */
import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { rawResponse } from '../../common/interceptors/transform.interceptor'
import { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

describe('payment resume API contract', () => {
  it('accepts only the order number from the client request body', async () => {
    const dto = plainToInstance(ResumeAlipayWapPaymentDto, {
      orderNo: 'ELMALI202605241200000001',
    })

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })

  it('trusts the authenticated user id and returns the raw resume payload shape', async () => {
    const resumePayload = {
      orderNo: 'ELMALI202605241200000001',
      payUrl: 'https://example.com/pay',
      payableAmount: 29,
    }
    const paymentService = {
      resumeAlipayWapPayment: jest.fn().mockResolvedValue(resumePayload),
    } as unknown as PaymentService
    const orderWorkflow = {} as ConstructorParameters<typeof PaymentController>[1]
    const controller = new PaymentController(paymentService, orderWorkflow)

    const result = await controller.resumeAlipayWapPayment(
      {
        orderNo: 'ELMALI202605241200000001',
      },
      {
        user: {
          id: '42',
        },
      },
    )

    expect(paymentService.resumeAlipayWapPayment).toHaveBeenCalledWith({
      orderNo: 'ELMALI202605241200000001',
      userId: '42',
    })
    expect(result).toEqual(rawResponse(resumePayload))
  })
})

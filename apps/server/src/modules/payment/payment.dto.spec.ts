import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateAlipayWapPaymentDto } from './dto/create-alipay-wap-payment.dto'
import { ResumeAlipayWapPaymentDto } from './dto/resume-alipay-wap-payment.dto'

describe('payment request DTOs', () => {
  it('does not require client-sent userId when creating an Alipay WAP payment', async () => {
    const dto = plainToInstance(CreateAlipayWapPaymentDto, {
      shopId: '101',
      shopName: '示例商家',
      deliveryFee: 5,
      cartItems: [{
        itemId: '1001',
        qty: 2,
        unitPrice: 12,
      }],
    })

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })

  it('does not require client-sent userId when resuming an Alipay WAP payment', async () => {
    const dto = plainToInstance(ResumeAlipayWapPaymentDto, {
      orderNo: 'ELMALI202605241200000001',
    })

    const errors = await validate(dto)

    expect(errors).toHaveLength(0)
  })
})

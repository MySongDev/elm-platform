import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { CreateCustomerAddressDto, UpdateCustomerAddressDto } from './customer-address.dto'

describe.each([CreateCustomerAddressDto, UpdateCustomerAddressDto])('%p地址入参', (Dto) => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  })
  const valid = {
    name: '测试用户',
    phone: '19900001101',
    address: '测试路101号',
    addressDetail: '',
  }
  const transform = (body: object) => pipe.transform(body, {
    type: 'body',
    metatype: Dto,
  })

  it.each([true, false])('接受真实布尔值 %p', async (isDefault) => {
    await expect(transform({
      ...valid,
      isDefault,
    })).resolves.toMatchObject({ isDefault })
  })
  it('允许省略默认标志和空门牌', async () => {
    await expect(transform(valid)).resolves.toMatchObject({ addressDetail: '' })
  })
  it.each(['false', 'true', 0, 1, null, ''])('拒绝默认标志错误类型 %p', async (isDefault) => {
    await expect(transform({
      ...valid,
      isDefault,
    })).rejects.toBeInstanceOf(BadRequestException)
  })
  it.each(['', '   '])('拒绝空姓名和主体 %p', async (empty) => {
    await expect(transform({
      ...valid,
      name: empty,
    })).rejects.toBeInstanceOf(BadRequestException)
    await expect(transform({
      ...valid,
      address: empty,
    })).rejects.toBeInstanceOf(BadRequestException)
  })
})

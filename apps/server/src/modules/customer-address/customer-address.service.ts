import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCustomerAddressDto } from './dto/customer-address.dto'

@Injectable()
export class CustomerAddressService {
  constructor(private readonly prisma: PrismaService) {}

  list(customerId: number) {
    return this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
  }

  create(customerId: number, dto: CreateCustomerAddressDto) {
    return this.prisma.customerAddress.create({
      data: {
        customerId,
        name: dto.name,
        phone: dto.phone,
        phoneBk: dto.phoneBk ?? null,
        address: dto.address,
        addressDetail: dto.addressDetail,
        geohash: dto.geohash ?? '',
        sex: dto.sex ?? 1,
        tag: dto.tag ?? '家',
        tagType: dto.tagType ?? 2,
        poiType: dto.poiType ?? 0,
      },
    })
  }

  async remove(customerId: number, id: number) {
    const existing = await this.prisma.customerAddress.findFirst({
      where: {
        id,
        customerId,
      },
    })
    if (!existing) {
      throw new NotFoundException('收货地址不存在')
    }

    await this.prisma.customerAddress.delete({ where: { id } })
    return { success: true }
  }
}

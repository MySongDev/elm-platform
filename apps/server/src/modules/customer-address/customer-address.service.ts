import type { Prisma } from '../../generated/prisma/client'
import type { CustomerAddressCreateInput, CustomerAddressUpdateInput } from './customer-address.inputs'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CustomerAddressService {
  constructor(private readonly prisma: PrismaService) {}

  list(customerId: number) {
    return this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
  }

  detail(customerId: number, id: number) {
    return this.findOwned(this.prisma, customerId, id)
  }

  /**
   * 先锁客户行，尚无地址的两次请求也能依次执行，不会争抢默认地址而失败。
   * 归属检查放在锁后，否则并发删除会让另一个请求报服务器错误。
   */
  private withLockedCustomer<T>(customerId: number, work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      const users = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM customer_users WHERE id = ${customerId} FOR UPDATE
      `
      if (!users.length)
        throw new NotFoundException('用户不存在')
      return work(tx)
    }, { isolationLevel: 'ReadCommitted' })
  }

  private async findOwned(tx: Pick<Prisma.TransactionClient, 'customerAddress'>, customerId: number, id: number) {
    const address = await tx.customerAddress.findFirst({
      where: {
        id,
        customerId,
      },
    })
    if (!address)
      throw new NotFoundException('收货地址不存在')
    return address
  }

  private buildAddressData(dto: CustomerAddressCreateInput) {
    return {
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
      isDefault: dto.isDefault ?? false,
    }
  }

  private clearDefault(tx: Prisma.TransactionClient, customerId: number, exceptId?: number) {
    return tx.customerAddress.updateMany({
      where: {
        customerId,
        isDefault: true,
        ...(exceptId === undefined ? {} : { NOT: { id: exceptId } }),
      },
      data: { isDefault: false },
    })
  }

  create(customerId: number, dto: CustomerAddressCreateInput) {
    return this.withLockedCustomer(customerId, async (tx) => {
      if (dto.isDefault === true)
        await this.clearDefault(tx, customerId)
      return tx.customerAddress.create({
        data: {
          customerId,
          ...this.buildAddressData(dto),
        },
      })
    })
  }

  /** PUT与兼容PATCH都全量回写；前端必须回传希望保留的选填字段。 */
  update(customerId: number, id: number, dto: CustomerAddressUpdateInput) {
    return this.withLockedCustomer(customerId, async (tx) => {
      await this.findOwned(tx, customerId, id)
      if (dto.isDefault === true)
        await this.clearDefault(tx, customerId, id)
      return tx.customerAddress.update({
        where: { id },
        data: this.buildAddressData(dto),
      })
    })
  }

  setDefault(customerId: number, id: number) {
    return this.withLockedCustomer(customerId, async (tx) => {
      await this.findOwned(tx, customerId, id)
      await this.clearDefault(tx, customerId, id)
      await tx.customerAddress.update({
        where: { id },
        data: { isDefault: true },
      })
      return { success: true }
    })
  }

  /** 删除默认后允许无默认，不擅自替用户选择另一条地址。 */
  remove(customerId: number, id: number) {
    return this.withLockedCustomer(customerId, async (tx) => {
      await this.findOwned(tx, customerId, id)
      await tx.customerAddress.delete({ where: { id } })
      return { success: true }
    })
  }
}

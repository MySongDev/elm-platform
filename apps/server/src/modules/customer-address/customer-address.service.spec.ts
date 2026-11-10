import type { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { CustomerAddressService } from './customer-address.service'

function setup() {
  const calls: string[] = []
  const tx = {
    $queryRaw: jest.fn(async () => { calls.push('lock'); return [{ id: 1 }] }),
    customerAddress: {
      findFirst: jest.fn(async () => { calls.push('owned'); return { id: 7 } as { id: number } | null }),
      updateMany: jest.fn(async () => { calls.push('clear'); return { count: 1 } }),
      create: jest.fn(async () => { calls.push('create'); return { id: 8 } }),
      update: jest.fn(async () => { calls.push('update'); return { id: 7 } }),
      delete: jest.fn(async () => { calls.push('delete'); return { id: 7 } }),
    },
  }
  const prisma = {
    $transaction: jest.fn((work: (client: typeof tx) => Promise<unknown>, _options?: object) => work(tx)),
  }
  return {
    tx,
    calls,
    service: new CustomerAddressService(prisma as unknown as PrismaService),
  }
}
const body = {
  name: '测试用户',
  phone: '19900001101',
  address: '测试路',
  addressDetail: '',
  isDefault: true,
}

describe('地址写入顺序', () => {
  // 空集合时也必须先锁客户；真实数据库并发另外由HTTP复验，不用mock假装证明行锁。
  it('新增默认先锁再清旧默认再创建', async () => {
    const { service, calls, tx } = setup()
    await service.create(1, body)
    expect(calls).toEqual(['lock', 'clear', 'create'])
    expect(tx.customerAddress.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ customerId: 1 }) }))
  })
  it('编辑先锁并查归属，再改默认及字段', async () => {
    const { service, calls } = setup()
    await service.update(1, 7, body)
    expect(calls).toEqual(['lock', 'owned', 'clear', 'update'])
  })
  it('专用默认入口与其他写入口共用锁顺序', async () => {
    const { service, calls } = setup()
    await service.setDefault(1, 7)
    expect(calls).toEqual(['lock', 'owned', 'clear', 'update'])
  })
  it('删除先锁后查归属', async () => {
    const { service, calls } = setup()
    await service.remove(1, 7)
    expect(calls).toEqual(['lock', 'owned', 'delete'])
  })
  it('别人的或已删除地址不能清除当前用户的默认', async () => {
    const { service, tx } = setup()
    tx.customerAddress.findFirst.mockResolvedValue(null)
    await expect(service.update(1, 7, body)).rejects.toBeInstanceOf(NotFoundException)
    expect(tx.customerAddress.updateMany).not.toHaveBeenCalled()
    expect(tx.customerAddress.update).not.toHaveBeenCalled()
  })
})

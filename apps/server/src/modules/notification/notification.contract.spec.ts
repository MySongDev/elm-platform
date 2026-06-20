import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'

describe('notificationController', () => {
  let moduleRef: TestingModule
  let controller: NotificationController
  let service: jest.Mocked<Pick<NotificationService, 'list' | 'markRead' | 'markAllRead' | 'remove' | 'clear'>>

  beforeEach(async () => {
    const serviceMock = {
      list: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    }

    moduleRef = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: serviceMock,
        },
      ],
    }).compile()

    controller = moduleRef.get(NotificationController)
    service = moduleRef.get(NotificationService)
  })

  afterEach(async () => {
    await moduleRef.close()
  })

  function buildRequest(userId: number) {
    return {
      user: {
        id: userId,
        subjectType: 'admin',
      },
    }
  }

  it('gET / 委托 list 并从 req.user.id 读取 userId', async () => {
    service.list.mockResolvedValueOnce([])

    const result = await controller.list(buildRequest(42), { type: 'todo' } as any)

    expect(service.list).toHaveBeenCalledWith(42, 'todo')
    expect(result).toEqual([])
  })

  it('pATCH read-all 委托 markAllRead', async () => {
    service.markAllRead.mockResolvedValueOnce({ updatedCount: 3 })

    const result = await controller.markAllRead(buildRequest(7), { type: 'message' } as any)

    expect(service.markAllRead).toHaveBeenCalledWith(7, 'message')
    expect(result).toEqual({ updatedCount: 3 })
  })

  it('pATCH :id/read 委托 markRead', async () => {
    service.markRead.mockResolvedValueOnce({ id: 'n1' } as any)

    const result = await controller.markRead(buildRequest(7), 'n1')

    expect(service.markRead).toHaveBeenCalledWith(7, 'n1')
    expect(result).toEqual({ id: 'n1' })
  })

  it('dELETE :id 委托 remove', async () => {
    service.remove.mockResolvedValueOnce({ success: true })

    const result = await controller.remove(buildRequest(7), 'n1')

    expect(service.remove).toHaveBeenCalledWith(7, 'n1')
    expect(result).toEqual({ success: true })
  })

  it('dELETE / 委托 clear 并接受可选 type', async () => {
    service.clear.mockResolvedValueOnce({ deletedCount: 5 })

    const result = await controller.clear(buildRequest(7), { type: undefined } as any)

    expect(service.clear).toHaveBeenCalledWith(7, undefined)
    expect(result).toEqual({ deletedCount: 5 })
  })
})

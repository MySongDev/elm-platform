import type { NotificationType } from './notification.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { NotificationService } from './notification.service'

interface NotificationRecord {
  id: string
  userId: number
  type: NotificationType
  title: string
  description: string | null
  read: boolean
  avatar: string | null
  status: string | null
  source: string
  sourceRef: string | null
  createdAt: Date
  readAt: Date | null
}

function buildRecord(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 'noti_default',
    userId: 1,
    type: 'notification',
    title: '默认通知',
    description: null,
    read: false,
    avatar: null,
    status: null,
    source: 'SEED',
    sourceRef: null,
    createdAt: new Date('2026-06-20T08:00:00.000Z'),
    readAt: null,
    ...overrides,
  }
}

interface PrismaNotificationMock {
  findMany: jest.Mock
  findFirst: jest.Mock
  findUnique: jest.Mock
  update: jest.Mock
  updateMany: jest.Mock
  delete: jest.Mock
  deleteMany: jest.Mock
  create: jest.Mock
}

function buildPrismaMock(): PrismaNotificationMock {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  }
}

function buildService(prisma: PrismaNotificationMock) {
  return new NotificationService({ notification: prisma } as any)
}

describe('notificationService', () => {
  let prisma: PrismaNotificationMock
  let service: NotificationService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = buildService(prisma)
  })

  describe('list', () => {
    it('returns current user notifications sorted by createdAt desc then id desc', async () => {
      const a = buildRecord({
        id: 'a',
        createdAt: new Date('2026-06-20T08:00:00.000Z'),
      })
      const b = buildRecord({
        id: 'b',
        createdAt: new Date('2026-06-20T09:00:00.000Z'),
      })
      const c = buildRecord({
        id: 'c',
        createdAt: new Date('2026-06-20T09:00:00.000Z'),
      })
      prisma.findMany.mockResolvedValueOnce([c, b, a])

      const result = await service.list(7)

      expect(prisma.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })
      expect(result).toEqual([c, b, a])
    })

    it('filters by type when provided', async () => {
      prisma.findMany.mockResolvedValueOnce([])

      await service.list(7, 'todo')

      expect(prisma.findMany).toHaveBeenCalledWith({
        where: {
          userId: 7,
          type: 'todo',
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })
    })

    it('rejects unknown type with BadRequestException', async () => {
      await expect(service.list(7, 'spam' as any)).rejects.toBeInstanceOf(BadRequestException)
      expect(prisma.findMany).not.toHaveBeenCalled()
    })
  })

  describe('markRead', () => {
    it('updates read=true and readAt for a notification owned by the user', async () => {
      prisma.findFirst.mockResolvedValueOnce(buildRecord({
        id: 'n1',
        userId: 7,
      }))
      const updated = buildRecord({
        id: 'n1',
        userId: 7,
        read: true,
        readAt: new Date('2026-06-20T10:00:00.000Z'),
      })
      prisma.update.mockResolvedValueOnce(updated)

      const result = await service.markRead(7, 'n1')

      expect(prisma.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'n1',
          userId: 7,
        },
      })
      expect(prisma.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: expect.objectContaining({ read: true }),
      })
      expect(result.read).toBe(true)
      expect(result.readAt).toBeInstanceOf(Date)
    })

    it('throws NotFoundException when notification belongs to another user', async () => {
      prisma.findFirst.mockResolvedValueOnce(null)

      await expect(service.markRead(7, 'n1')).rejects.toBeInstanceOf(NotFoundException)
      expect(prisma.update).not.toHaveBeenCalled()
    })
  })

  describe('markAllRead', () => {
    it('updates all notifications for the user', async () => {
      prisma.updateMany.mockResolvedValueOnce({ count: 5 })

      const result = await service.markAllRead(7)

      expect(prisma.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 7,
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      })
      expect(result).toEqual({ updatedCount: 5 })
    })

    it('filters by type when provided', async () => {
      prisma.updateMany.mockResolvedValueOnce({ count: 2 })

      await service.markAllRead(7, 'message')

      expect(prisma.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 7,
          type: 'message',
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      })
    })

    it('rejects unknown type with BadRequestException', async () => {
      await expect(service.markAllRead(7, 'bogus' as any)).rejects.toBeInstanceOf(BadRequestException)
      expect(prisma.updateMany).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('deletes a notification owned by the user', async () => {
      prisma.findFirst.mockResolvedValueOnce(buildRecord({
        id: 'n1',
        userId: 7,
      }))
      prisma.delete.mockResolvedValueOnce(buildRecord({
        id: 'n1',
        userId: 7,
      }))

      const result = await service.remove(7, 'n1')

      expect(prisma.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'n1',
          userId: 7,
        },
      })
      expect(prisma.delete).toHaveBeenCalledWith({ where: { id: 'n1' } })
      expect(result).toEqual({ success: true })
    })

    it('throws NotFoundException when notification belongs to another user', async () => {
      prisma.findFirst.mockResolvedValueOnce(null)

      await expect(service.remove(7, 'n1')).rejects.toBeInstanceOf(NotFoundException)
      expect(prisma.delete).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('deletes all notifications for the user when type is omitted', async () => {
      prisma.deleteMany.mockResolvedValueOnce({ count: 9 })

      const result = await service.clear(7)

      expect(prisma.deleteMany).toHaveBeenCalledWith({ where: { userId: 7 } })
      expect(result).toEqual({ deletedCount: 9 })
    })

    it('filters by type when provided', async () => {
      prisma.deleteMany.mockResolvedValueOnce({ count: 3 })

      await service.clear(7, 'todo')

      expect(prisma.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 7,
          type: 'todo',
        },
      })
    })

    it('rejects unknown type with BadRequestException', async () => {
      await expect(service.clear(7, 'who?' as any)).rejects.toBeInstanceOf(BadRequestException)
      expect(prisma.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('createSecurityLoginNotification', () => {
    it('writes a notification with SECURITY_LOGIN source and ip/browser/os description', async () => {
      prisma.create.mockImplementation(async ({ data }) => ({
        id: 'created-1',
        ...data,
      }))

      const result = await service.createSecurityLoginNotification(7, {
        ip: '10.0.0.1',
        browser: 'Chrome',
        os: 'macOS',
      })

      expect(prisma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 7,
          type: 'notification',
          title: '安全登录提醒',
          source: 'SECURITY_LOGIN',
          description: '10.0.0.1（Chrome / macOS）',
          read: false,
        }),
      })
      expect(result.id).toBe('created-1')
      expect(result.source).toBe('SECURITY_LOGIN')
    })

    it('falls back to 未知 placeholders when ip/browser/os are missing', async () => {
      prisma.create.mockImplementation(async ({ data }) => ({
        id: 'created-2',
        ...data,
      }))

      await service.createSecurityLoginNotification(7, {})

      expect(prisma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: '未知 IP（未知浏览器 / 未知系统）',
        }),
      })
    })
  })
})

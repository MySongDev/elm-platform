import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export const NOTIFICATION_TYPES = ['notification', 'message', 'todo'] as const
export type NotificationType = typeof NOTIFICATION_TYPES[number]

export interface SecurityLoginContext {
  ip?: string
  browser?: string
  os?: string
}

export interface NotificationItem {
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

function assertNotificationType(value: unknown): asserts value is NotificationType {
  if (typeof value !== 'string' || !NOTIFICATION_TYPES.includes(value as NotificationType)) {
    throw new BadRequestException(`不支持的通知类型：${String(value)}`)
  }
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number, type?: NotificationType): Promise<NotificationItem[]> {
    if (type !== undefined)
      assertNotificationType(type)

    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }) as Promise<NotificationItem[]>
  }

  async markRead(userId: number, id: string): Promise<NotificationItem> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    })
    if (!existing) {
      throw new NotFoundException('通知不存在')
    }
    return this.prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    }) as Promise<NotificationItem>
  }

  async markAllRead(userId: number, type?: NotificationType): Promise<{ updatedCount: number }> {
    if (type !== undefined)
      assertNotificationType(type)

    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        ...(type ? { type } : {}),
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
    return { updatedCount: result.count }
  }

  async remove(userId: number, id: string): Promise<{ success: true }> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    })
    if (!existing) {
      throw new NotFoundException('通知不存在')
    }
    await this.prisma.notification.delete({ where: { id } })
    return { success: true }
  }

  async clear(userId: number, type?: NotificationType): Promise<{ deletedCount: number }> {
    if (type !== undefined)
      assertNotificationType(type)

    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
    })
    return { deletedCount: result.count }
  }

  async createSecurityLoginNotification(
    userId: number,
    context: SecurityLoginContext,
  ): Promise<NotificationItem> {
    const ip = context.ip?.trim() || '未知 IP'
    const browser = context.browser?.trim() || '未知浏览器'
    const os = context.os?.trim() || '未知系统'
    return this.prisma.notification.create({
      data: {
        userId,
        type: 'notification',
        title: '安全登录提醒',
        description: `${ip}（${browser} / ${os}）`,
        read: false,
        source: 'SECURITY_LOGIN',
      },
    }) as Promise<NotificationItem>
  }
}

import { IsIn, IsOptional } from 'class-validator'
import { NOTIFICATION_TYPES, NotificationType } from '../notification.service'

export class NotificationTypeQueryDto {
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES, { message: 'type 必须是 notification/message/todo 之一' })
  type?: NotificationType
}

export class MarkAllReadDto {
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES, { message: 'type 必须是 notification/message/todo 之一' })
  type?: NotificationType
}

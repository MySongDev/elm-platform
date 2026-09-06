import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ApiArrayResponse,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/swagger/api-response.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import {
  DeletedCountResponseDto,
  NotificationItemResponseDto,
  NotificationSuccessResponseDto,
  UpdatedCountResponseDto,
} from './dto/notification-response.dto'
import { MarkAllReadDto, NotificationTypeQueryDto } from './dto/notification.dto'
import { NotificationService } from './notification.service'

@ApiTags('通知中心')
@ApiBearerAuth()
@ApiErrorResponses(401, 500)
@UseGuards(AdminAuthGuard)
@Controller('admin/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取当前管理员通知列表' })
  @ApiArrayResponse(NotificationItemResponseDto)
  @ApiErrorResponses(400)
  async list(@Request() req: any, @Query() query: NotificationTypeQueryDto) {
    return this.notificationService.list(req.user.id, query.type)
  }

  @Patch('read-all')
  @ApiOperation({ summary: '按类型批量标记已读' })
  @ApiSuccessResponse(UpdatedCountResponseDto)
  @ApiErrorResponses(400)
  async markAllRead(@Request() req: any, @Body() body: MarkAllReadDto) {
    return this.notificationService.markAllRead(req.user.id, body?.type)
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记单条通知已读' })
  @ApiSuccessResponse(NotificationItemResponseDto)
  @ApiErrorResponses(404)
  async markRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationService.markRead(req.user.id, id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除单条通知' })
  @ApiSuccessResponse(NotificationSuccessResponseDto)
  @ApiErrorResponses(404)
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.notificationService.remove(req.user.id, id)
  }

  @Delete()
  @ApiOperation({ summary: '按类型清空通知' })
  @ApiSuccessResponse(DeletedCountResponseDto)
  @ApiErrorResponses(400)
  async clear(@Request() req: any, @Query() query: NotificationTypeQueryDto) {
    return this.notificationService.clear(req.user.id, query.type)
  }
}

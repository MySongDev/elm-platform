import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { SuccessResponseDto } from '../../../common/swagger/dto/success-response.dto'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { OnlineUserService } from '../../../modules/monitor/online-user.service'
import { OnlineUserResponseDto } from './dto/monitor-response.dto'

@ApiTags('管理端－在线用户')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/monitor/online-users')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminOnlineUserController {
  constructor(private readonly onlineUserService: OnlineUserService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getOnlineUsers',
    summary: '在线用户列表',
  })
  @ApiArrayResponse(OnlineUserResponseDto)
  getOnlineUsers() {
    return this.onlineUserService.getOnlineUsers()
  }

  @Post(':id/force-logout')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_forceLogout',
    summary: '强制用户下线',
  })
  @ApiSuccessResponse(SuccessResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  forceLogout(@Param('id', ParseIntPipe) id: number) {
    return this.onlineUserService.forceLogout(id)
  }
}

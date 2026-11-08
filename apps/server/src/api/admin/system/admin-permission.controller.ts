import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses } from '../../../common/swagger/api-response.decorator'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { buttonPermissions, pagePermissions } from '../../../modules/permission/permission-catalog'
import { ButtonPermissionResponseDto, PagePermissionResponseDto } from './dto/permission-response.dto'

/** 这里只公开静态权限目录；没有独立业务规则，不为返回常量再增加转发 Service。 */
@ApiTags('管理端－权限目录')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/permissions')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminPermissionController {
  @Get('pages')
  @Roles('admin', 'user')
  @ApiOperation({
    operationId: 'AdminController_getPagePermissions',
    summary: '页面权限列表',
  })
  @ApiArrayResponse(PagePermissionResponseDto)
  getPagePermissions() {
    return pagePermissions
  }

  @Get('buttons')
  @Roles('admin', 'user')
  @ApiOperation({
    operationId: 'AdminController_getButtonPermissions',
    summary: '按钮权限列表',
  })
  @ApiArrayResponse(ButtonPermissionResponseDto)
  getButtonPermissions() {
    return buttonPermissions
  }
}

import { Controller, Get, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses } from '../../../common/swagger/api-response.decorator'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { LogQueryService } from '../../../modules/monitor/log-query.service'
import { TenantContextService } from '../../../modules/tenant/tenant-context.service'
import { LoginLogResponseDto, OperationLogResponseDto, SystemLogResponseDto } from './dto/monitor-response.dto'

@ApiTags('管理端－日志查询')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/monitor')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminLogController {
  constructor(
    private readonly logQueryService: LogQueryService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('login-logs')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getLoginLogs',
    summary: '登录日志',
  })
  @ApiArrayResponse(LoginLogResponseDto)
  async getLoginLogs(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.logQueryService.getLoginLogs(context)
  }

  @Get('operation-logs')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getOperationLogs',
    summary: '操作日志',
  })
  @ApiArrayResponse(OperationLogResponseDto)
  async getOperationLogs(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.logQueryService.getOperationLogs(context)
  }

  @Get('system-logs')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getSystemLogs',
    summary: '系统日志',
  })
  @ApiArrayResponse(SystemLogResponseDto)
  async getSystemLogs(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.logQueryService.getSystemLogs(context)
  }
}

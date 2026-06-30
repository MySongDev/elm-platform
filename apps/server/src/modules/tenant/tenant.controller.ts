import type { TenantEvent } from './tenant.types'
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ApiArrayResponse,
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../common/swagger/api-response.decorator'
import { RequirePermissions } from '../auth/decorators/permissions.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import {
  TenantActionLogResponseDto,
  TenantDetailResponseDto,
  TenantResponseDto,
} from './dto/tenant-response.dto'
import {
  CreateTenantDto,
  TenantEventParamDto,
  TenantTransitionDto,
  UpdateTenantDto,
} from './dto/tenant.dto'
import { TenantService } from './tenant.service'

@ApiTags('租户管理')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/tenants')
@UseGuards(AdminAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @RequirePermissions('platform:tenant:view')
  @ApiOperation({ summary: '租户列表' })
  @ApiArrayResponse(TenantResponseDto)
  listTenants() {
    return this.tenantService.listTenants()
  }

  @Post()
  @RequirePermissions('platform:tenant:create')
  @ApiOperation({ summary: '创建租户' })
  @ApiSuccessResponse(TenantResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.createTenant(dto)
  }

  @Get(':id')
  @RequirePermissions('platform:tenant:view')
  @ApiOperation({ summary: '租户详情' })
  @ApiSuccessResponse(TenantDetailResponseDto)
  @ApiErrorResponses(400, 404)
  getTenantDetail(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.getTenantDetail(id)
  }

  @Patch(':id')
  @RequirePermissions('platform:tenant:update')
  @ApiOperation({ summary: '更新租户' })
  @ApiSuccessResponse(TenantResponseDto)
  @ApiErrorResponses(400, 404)
  updateTenant(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateTenant(id, dto)
  }

  @Post(':id/events/:event')
  @RequirePermissions('platform:tenant:transition')
  @ApiOperation({ summary: '触发租户状态事件' })
  @ApiSuccessResponse(TenantResponseDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409)
  transitionTenant(
    @Param('id', ParseIntPipe) id: number,
    @Param() params: TenantEventParamDto,
    @Body() dto: TenantTransitionDto,
    @Request() req: any,
  ) {
    return this.tenantService.transitionTenant(
      id,
      params.event as TenantEvent,
      {
        id: req.user.id,
        name: req.user.username || `admin#${req.user.id}`,
        type: 'PLATFORM_ADMIN',
      },
      dto,
    )
  }

  @Get(':id/action-logs')
  @RequirePermissions('platform:tenant:view')
  @ApiOperation({ summary: '租户状态动作日志' })
  @ApiArrayResponse(TenantActionLogResponseDto)
  @ApiErrorResponses(400, 404)
  getTenantActionLogs(@Param('id', ParseIntPipe) id: number) {
    return this.tenantService.getTenantActionLogs(id)
  }
}

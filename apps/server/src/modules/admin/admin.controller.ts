import {
  Body,
  Controller,
  Delete,
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
import { Roles } from '../auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { TenantContextService } from '../tenant/tenant-context.service'
import { AdminService } from './admin.service'
import {
  ButtonPermissionResponseDto,
  DeptResponseDto,
  LoginLogResponseDto,
  MenuResponseDto,
  OnlineUserResponseDto,
  OperationLogResponseDto,
  PagePermissionResponseDto,
  RoleResponseDto,
  SuccessResponseDto,
  SystemLogResponseDto,
} from './dto/admin-response.dto'
import { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto'

@ApiTags('后台管理')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get('permissions/pages')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '页面权限列表' })
  @ApiArrayResponse(PagePermissionResponseDto)
  getPagePermissions() {
    return this.adminService.getPagePermissions()
  }

  @Get('permissions/buttons')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '按钮权限列表' })
  @ApiArrayResponse(ButtonPermissionResponseDto)
  getButtonPermissions() {
    return this.adminService.getButtonPermissions()
  }

  @Get('monitor/online-users')
  @Roles('admin')
  @ApiOperation({ summary: '在线用户列表' })
  @ApiArrayResponse(OnlineUserResponseDto)
  getOnlineUsers() {
    return this.adminService.getOnlineUsers()
  }

  @Post('monitor/online-users/:id/force-logout')
  @Roles('admin')
  @ApiOperation({ summary: '强制用户下线' })
  @ApiSuccessResponse(SuccessResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  forceLogout(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceLogout(id)
  }

  @Get('monitor/login-logs')
  @Roles('admin')
  @ApiOperation({ summary: '登录日志' })
  @ApiArrayResponse(LoginLogResponseDto)
  async getLoginLogs(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.adminService.getLoginLogs(context)
  }

  @Get('monitor/operation-logs')
  @Roles('admin')
  @ApiOperation({ summary: '操作日志' })
  @ApiArrayResponse(OperationLogResponseDto)
  async getOperationLogs(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.adminService.getOperationLogs(context)
  }

  @Get('monitor/system-logs')
  @Roles('admin')
  @ApiOperation({ summary: '系统日志' })
  @ApiArrayResponse(SystemLogResponseDto)
  async getSystemLogs(@Request() req: any) {
    const context = await this.tenantContext.fromRequestUser(req.user)
    return this.adminService.getSystemLogs(context)
  }

  @Get('system/roles')
  @Roles('admin')
  @ApiOperation({ summary: '角色列表' })
  @ApiArrayResponse(RoleResponseDto)
  getRoles() {
    return this.adminService.getRoles()
  }

  @Post('system/roles')
  @Roles('admin')
  @ApiOperation({ summary: '创建角色' })
  @ApiSuccessResponse(RoleResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createRole(@Body() dto: UpsertRoleDto) {
    return this.adminService.createRole(dto)
  }

  @Patch('system/roles/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新角色' })
  @ApiSuccessResponse(RoleResponseDto)
  @ApiErrorResponses(400, 404)
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertRoleDto) {
    return this.adminService.updateRole(id, dto)
  }

  @Delete('system/roles/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除角色' })
  @ApiSuccessResponse(SuccessResponseDto)
  @ApiErrorResponses(400)
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRole(id)
  }

  @Get('system/menus')
  @Roles('admin')
  @ApiOperation({ summary: '菜单列表' })
  @ApiArrayResponse(MenuResponseDto)
  getMenus() {
    return this.adminService.getMenus()
  }

  @Post('system/menus')
  @Roles('admin')
  @ApiOperation({ summary: '创建菜单' })
  @ApiSuccessResponse(MenuResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createMenu(@Body() dto: UpsertMenuDto) {
    return this.adminService.createMenu(dto)
  }

  @Patch('system/menus/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新菜单' })
  @ApiSuccessResponse(MenuResponseDto)
  @ApiErrorResponses(400, 404)
  updateMenu(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertMenuDto) {
    return this.adminService.updateMenu(id, dto)
  }

  @Delete('system/menus/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除菜单' })
  @ApiSuccessResponse(SuccessResponseDto)
  @ApiErrorResponses(400)
  deleteMenu(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteMenu(id)
  }

  @Get('system/depts')
  @Roles('admin')
  @ApiOperation({ summary: '部门列表' })
  @ApiArrayResponse(DeptResponseDto)
  getDepts() {
    return this.adminService.getDepts()
  }

  @Post('system/depts')
  @Roles('admin')
  @ApiOperation({ summary: '创建部门' })
  @ApiSuccessResponse(DeptResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createDept(@Body() dto: UpsertDeptDto) {
    return this.adminService.createDept(dto)
  }

  @Patch('system/depts/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新部门' })
  @ApiSuccessResponse(DeptResponseDto)
  @ApiErrorResponses(400, 404)
  updateDept(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertDeptDto) {
    return this.adminService.updateDept(id, dto)
  }

  @Delete('system/depts/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除部门' })
  @ApiSuccessResponse(SuccessResponseDto)
  @ApiErrorResponses(400)
  deleteDept(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDept(id)
  }
}

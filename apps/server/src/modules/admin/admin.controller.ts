import type { AdminService } from './admin.service'
import type { UpsertDeptDto, UpsertMenuDto, UpsertRoleDto } from './dto/admin.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@ApiTags('后台管理')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('permissions/pages')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '页面权限列表' })
  getPagePermissions() {
    return this.adminService.getPagePermissions()
  }

  @Get('permissions/buttons')
  @Roles('admin', 'user')
  @ApiOperation({ summary: '按钮权限列表' })
  getButtonPermissions() {
    return this.adminService.getButtonPermissions()
  }

  @Get('monitor/online-users')
  @Roles('admin')
  @ApiOperation({ summary: '在线用户列表' })
  getOnlineUsers() {
    return this.adminService.getOnlineUsers()
  }

  @Post('monitor/online-users/:id/force-logout')
  @Roles('admin')
  @ApiOperation({ summary: '强制用户下线' })
  forceLogout(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceLogout(id)
  }

  @Get('monitor/login-logs')
  @Roles('admin')
  @ApiOperation({ summary: '登录日志' })
  getLoginLogs() {
    return this.adminService.getLoginLogs()
  }

  @Get('monitor/operation-logs')
  @Roles('admin')
  @ApiOperation({ summary: '操作日志' })
  getOperationLogs() {
    return this.adminService.getOperationLogs()
  }

  @Get('monitor/system-logs')
  @Roles('admin')
  @ApiOperation({ summary: '系统日志' })
  getSystemLogs() {
    return this.adminService.getSystemLogs()
  }

  @Get('system/roles')
  @Roles('admin')
  @ApiOperation({ summary: '角色列表' })
  getRoles() {
    return this.adminService.getRoles()
  }

  @Post('system/roles')
  @Roles('admin')
  @ApiOperation({ summary: '创建角色' })
  createRole(@Body() dto: UpsertRoleDto) {
    return this.adminService.createRole(dto)
  }

  @Patch('system/roles/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新角色' })
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertRoleDto) {
    return this.adminService.updateRole(id, dto)
  }

  @Delete('system/roles/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除角色' })
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRole(id)
  }

  @Get('system/menus')
  @Roles('admin')
  @ApiOperation({ summary: '菜单列表' })
  getMenus() {
    return this.adminService.getMenus()
  }

  @Post('system/menus')
  @Roles('admin')
  @ApiOperation({ summary: '创建菜单' })
  createMenu(@Body() dto: UpsertMenuDto) {
    return this.adminService.createMenu(dto)
  }

  @Patch('system/menus/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新菜单' })
  updateMenu(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertMenuDto) {
    return this.adminService.updateMenu(id, dto)
  }

  @Delete('system/menus/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除菜单' })
  deleteMenu(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteMenu(id)
  }

  @Get('system/depts')
  @Roles('admin')
  @ApiOperation({ summary: '部门列表' })
  getDepts() {
    return this.adminService.getDepts()
  }

  @Post('system/depts')
  @Roles('admin')
  @ApiOperation({ summary: '创建部门' })
  createDept(@Body() dto: UpsertDeptDto) {
    return this.adminService.createDept(dto)
  }

  @Patch('system/depts/:id')
  @Roles('admin')
  @ApiOperation({ summary: '更新部门' })
  updateDept(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertDeptDto) {
    return this.adminService.updateDept(id, dto)
  }

  @Delete('system/depts/:id')
  @Roles('admin')
  @ApiOperation({ summary: '删除部门' })
  deleteDept(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteDept(id)
  }
}

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { SuccessResponseDto } from '../../../common/swagger/dto/success-response.dto'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { RoleService } from '../../../modules/role/role.service'
import { RoleResponseDto } from './dto/role-response.dto'
import { UpsertRoleDto } from './dto/role.dto'

@ApiTags('管理端－角色管理')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/system/roles')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminRoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getRoles',
    summary: '角色列表',
  })
  @ApiArrayResponse(RoleResponseDto)
  getRoles() {
    return this.roleService.getRoles()
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_createRole',
    summary: '创建角色',
  })
  @ApiSuccessResponse(RoleResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createRole(@Body() dto: UpsertRoleDto) {
    return this.roleService.createRole(dto)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_updateRole',
    summary: '更新角色',
  })
  @ApiSuccessResponse(RoleResponseDto)
  @ApiErrorResponses(400, 404)
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertRoleDto) {
    return this.roleService.updateRole(id, dto)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_deleteRole',
    summary: '删除角色',
  })
  @ApiSuccessResponse(SuccessResponseDto)
  @ApiErrorResponses(400)
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.deleteRole(id)
  }
}

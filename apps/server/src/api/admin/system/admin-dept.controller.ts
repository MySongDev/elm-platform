import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiArrayResponse, ApiErrorResponses, ApiSuccessResponse } from '../../../common/swagger/api-response.decorator'
import { SuccessResponseDto } from '../../../common/swagger/dto/success-response.dto'
import { Roles } from '../../../modules/auth/decorators/roles.decorator'
import { AdminAuthGuard } from '../../../modules/auth/guards/admin-auth.guard'
import { RolesGuard } from '../../../modules/auth/guards/roles.guard'
import { DeptService } from '../../../modules/dept/dept.service'
import { DeptResponseDto } from './dto/dept-response.dto'
import { UpsertDeptDto } from './dto/dept.dto'

@ApiTags('管理端－部门管理')
@ApiBearerAuth()
@ApiErrorResponses(401, 403, 500)
@Controller('admin/system/depts')
@UseGuards(AdminAuthGuard, RolesGuard)
export class AdminDeptController {
  constructor(private readonly deptService: DeptService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_getDepts',
    summary: '部门列表',
  })
  @ApiArrayResponse(DeptResponseDto)
  getDepts() {
    return this.deptService.getDepts()
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_createDept',
    summary: '创建部门',
  })
  @ApiSuccessResponse(DeptResponseDto, { status: 201 })
  @ApiErrorResponses(400)
  createDept(@Body() dto: UpsertDeptDto) {
    return this.deptService.createDept(dto)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_updateDept',
    summary: '更新部门',
  })
  @ApiSuccessResponse(DeptResponseDto)
  @ApiErrorResponses(400, 404)
  updateDept(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertDeptDto) {
    return this.deptService.updateDept(id, dto)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    operationId: 'AdminController_deleteDept',
    summary: '删除部门',
  })
  @ApiSuccessResponse(SuccessResponseDto)
  @ApiErrorResponses(400)
  deleteDept(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.deleteDept(id)
  }
}
